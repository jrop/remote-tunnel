#!/usr/bin/env node
const getPort = require('get-port')
const express = require('express')
const net = require('net')
const _ = require('lodash')

const debug = require('debug')('rt:server')

class Server {
	async createForwarder(clientSock) {
		const port = await getPort()
		debug('Forwarder created on port', port)
		const srv = net
			.createServer(remoteSock => {
				const cleanup = _.once(function() {
					debug('Closing forwarder on port', port)
					remoteSock.destroy()
					clientSock.destroy()
					srv.close()
				})
				clientSock.on('data', d => remoteSock.write(d))
				clientSock.on('close', () => cleanup())

				remoteSock.on('data', d => clientSock.write(d))
				remoteSock.on('close', () => cleanup())
			})
			.listen(port)
		srv.maxConnections = 1

		this._ctrlSock.write(`${port}\n`)
		return port
	}

	async init(requestedPublicPort) {
		//
		// start control socket:
		this.ctrlPort = await getPort()
		this._ctrlServer = net
			.createServer(sock => {
				debug('remote connected')
				this._ctrlSock = sock.on('close', () => {
					debug('remote disconnected')
					this._ctrlSock = null
					this._ctrlServer.close()
				})
			})
			.listen(this.ctrlPort)
		// make the control socket connect in a timely fashion:
		setTimeout(() => {
			if (!this._ctrlSock) {
				debug('remote did not connect on time')
				this._ctrlServer.close()
				this._pubSock.close()
			}
		}, 10000)
		this._ctrlServer.maxConnections = 1

		//
		// start public socket
		this.pubPort = await getPort(requestedPublicPort)
		this._pubSock = net
			.createServer(async sock => {
				const port = await this.createForwarder(sock)
			})
			.listen(this.pubPort)
	}
}

async function createTunnel(port) {
	const t = new Server()
	await t.init(port)
	return t
}

module.exports = createTunnel

if (require.main === module) {
	express()
		.get('/create-tunnel/:port?', (req, res) => {
			createTunnel(req.params.port)
				.then(t => res.json(_.pick(t, ['ctrlPort', 'pubPort'])))
				.catch(e => res.status(500).json({error: e.message}))
		})
		.listen(3000)
}
