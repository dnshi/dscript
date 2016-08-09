#!/usr/bin/env node

'use strict'

const Stream = require('stream')
const start = Date.now()

const transSummaryObject = exports.transSummaryObject = new Stream.Transform({
  objectMode: true,
  transform(buf, _, next) {
    const summary = {
      elapsedTime: Date.now() - start,
      totalLength: buf.length,
      totalLines: buf.toString().split(/\r\n|\r|\n/).length
    }
    next(null, JSON.stringify(summary))
  }
})

const transReport = exports.transReport = new Stream.Transform({
  objectMode: true,
  transform(buf, _, next) {
    const summary = JSON.parse(buf.toString())
    const throughputRate = summary.totalLength / summary.elapsedTime * 1000

    next(
      null,
      `Total Size: ${totalLengthToString(summary.totalLength)}, ` +
      `Total Lines: ${summary.totalLines} - ${elapsedTimeToString(summary.elapsedTime)} ` +
      `(${throughputRateToString(throughputRate)})\n`
    )
  }
})

const totalLengthToString = totalLength =>
  totalLength >= 1024
    ? Number(totalLength / 1024).toFixed(2) + ' kB'
    : totalLength + ' Bytes'

const elapsedTimeToString = elapsedTime =>
  elapsedTime >= 1000
    ? Number(elapsedTime / 1000).toFixed(2) + 's'
    : elapsedTime + 'ms'

const throughputRateToString = throughputRate =>
  throughputRate >= 1000
    ? Number(throughputRate / 1000).toFixed(2) + ' kB/sec'
    : throughputRate.toFixed(2) + ' bytes/sec'

const flag = process.argv[2]
switch(flag) {
  case '-v':
    version()
    break

  case '-h':
    help()
    break

  default:
    summary()
}

function version() {
  const versionNum = require('./package.json').version
  process.stdout.write(`v${versionNum}\n`)
}

function help() {
  process.stdout.write(
    'Usage: cat/echo {TEXT} | dscript\n' +
    '       dscript [arguments]\n' +
    '\n' +
    'Options:\n' +
    '  -v print dscript version\n' +
    '  -h help menu\n'
  )
}

function summary() {
  process.stdin.setEncoding('utf8')
  process.stdin
    .pipe(transSummaryObject)
    .pipe(transReport)
    .pipe(process.stdout)
}
