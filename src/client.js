#!/usr/bin/env node
const fetch = require('node-fetch')
const minimist = require('minimist')
const net = require('net')
const _ = require('lodash')

const debug = require('debug')('rt:client')

//
// spawn a socket that connects a client from the server
// to a local port on this computer
function createLocalForwarder(host, hubPort, localPort) {
	debug(`Creating forwarder at hub:${hubPort}`)
	const hub = net.createConnection({host, port: hubPort})
	const local = net.createConnection({port: localPort})

	const cleanup = _.once(function() {
		debug(`Closing forwarder at hub:${hubPort}`)
		hub.destroy()
		local.destroy()
	})

	hub.on('data', d => local.write(d))
	hub.on('close', () => cleanup())

	local.on('data', d => hub.write(d))
	local.on('close', () => cleanup())
}

//
// create the control socket that spawns more sockets on demand
async function expose(host, requestedPublicPort, localPort) {
	const {ctrlPort, pubPort} = await fetch(
		`http://${host}:3000/create-tunnel/${requestedPublicPort || ''}`
	).then(r => r.json())
	debug('ctrlPort is', ctrlPort)
	console.log('Public port is', pubPort)
	const sock = net.createConnection({
		host,
		port: ctrlPort,
	})
	sock.on('data', d => {
		const hubPort = parseInt(d.toString('utf-8'))
		createLocalForwarder(host, hubPort, localPort)
	})
}

module.exports = expose

if (require.main === module) {
	function help() {
		console.error(
			`Usage: rt --host example.com --public-port 8022 --local-port 22

Options:
  --help           : This help message
  --host/-h        : The host to tunnel through
  --public-port/-p : The public port to request
  --local-port/-l  : The local port to tunnel to
	`.trim()
		)
		process.exitCode = 1
	}
	const args = minimist(process.argv.slice(2), {
		alias: {
			h: 'host',
			p: 'public-port',
			l: 'local-port',
		},
	})
	if (args.help || !args.host) help()
	else expose(args.host || 'localhost', args['public-port'], args['local-port'])
}
