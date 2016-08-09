'use strict'

const test = require('tape')
const Stream = require('stream')
const dscript = require('./dscript')

test('SummaryObject Stream', (t) => {
  const transSummaryObject = clone(dscript.transSummaryObject)
  const ws = new Stream.Writable({
    write(buf) {
      const obj = JSON.parse(buf.toString())
      t.equal(obj.totalLength, 108, `expected total length is ${obj.totalLength}`)
      t.equal(obj.totalLines, 5, `expected total lines is ${obj.totalLines}`)

      t.notEqual(obj.elapsedTime, undefined, `expected elapsed time is not undefined`)
      t.notEqual(obj.elapsedTime, null, `expected elapsed time is not null`)
      t.end()
    }
  })
  transSummaryObject.pipe(ws)

  transSummaryObject.write(
    'This is a test\n' +
    'This is the second line\n' +
    'This is the third line\n' +
    'This is the last one with an extra empty line\n'
  )
})

test('SummaryObject Report Stream (fast)', (t) => {
  const transReport = clone(dscript.transReport)
  const ws = new Stream.Writable({
    write(buf) {
      t.equal(
        buf.toString(),
        'Total Size: 108 Bytes, Total Lines: 5 - 20ms (5.40 kB/sec)\n',
        'expected output string for high throughput rate is matched'
      )
      t.end()
    }
  })
  transReport.pipe(ws)

  transReport.write(JSON.stringify({ elapsedTime: 20, totalLength: 108, totalLines: 5 }))
})

test('SummaryObject Report Stream (slow)', (t) => {
  const transReport = clone(dscript.transReport)
  const ws = new Stream.Writable({
    write(buf) {
      t.equal(
        buf.toString(),
        'Total Size: 108 Bytes, Total Lines: 5 - 1.00s (108.00 bytes/sec)\n',
        'expected output string for low throughput rate is matched'
      )
      t.end()
    }
  })
  transReport.pipe(ws)

  transReport.write(JSON.stringify({ elapsedTime: 1000, totalLength: 108, totalLines: 5 }))
})

function clone(transform) {
  const ts = new Stream.Transform({ objectMode: true })
  ts._transform = transform._transform
  ts._flush = transform._flush // Actually I am not using flush, but clone function should have it
  return ts
}
