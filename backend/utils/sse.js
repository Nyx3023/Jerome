const clients = []

function addClient(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })
  res.write('\n')
  clients.push(res)
  res.on('close', () => {
    const i = clients.indexOf(res)
    if (i !== -1) clients.splice(i, 1)
  })
}

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const c of clients) {
    try { c.write(msg) } catch(e) {}
  }
}

module.exports = { addClient, broadcast }