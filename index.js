const config = require('config')
const fs = require('fs')
const { spawnSync } = require('child_process')
const tilebelt = require('@mapbox/tilebelt')
const dz = config.get('dz')
const maxz = config.get('maxz')

const getPath = (zxy) => {
  const key = zxy.join('-')
  if (key === '0-0-0') {
    return `${config.get('src')}`
  } else {
    return `${config.get('dst')}/${key}.osm.pbf`
  }
}

const osmExport = (src, dst) => {
  const startTime = new Date()
  const srcPath = getPath(src)
  const dstPath = getPath(dst)
  let bbox = tilebelt.tileToBBOX([dst[1], dst[2], dst[0]])
  const xb = (bbox[2] - bbox[0]) * 5 / 256
  const yb = (bbox[3] - bbox[1]) * 5 / 256
  bbox = [
    bbox[0] - xb,
    bbox[1] - yb,
    bbox[2] + xb,
    bbox[3] + yb 
  ]
  if (bbox[0] < -180) bbox[0] = -180
  if (bbox[2] > 180) bbox[2] = 180
  params = [
    `extract`,
    `--strategy=smart`,
    `--verbose`,
    `--overwrite`,
    `--progress`,
    `--bbox=${bbox.join(',')}`,
    `--output=${dstPath}-part`,
    `--output-format=pbf`,
    srcPath
  ]
  if (!fs.existsSync(dstPath)) {
    console.log(`osmium ${params.join(' ')}`)
    spawnSync('osmium', params, {stdio: 'inherit'})
    fs.renameSync(`${dstPath}-part`, dstPath)
    console.log(` -> ${Math.round((new Date() - startTime) / 1000)}s`)
  }
  if (dst[0] < maxz) {
    divide(dst, dz)
  }
}

const divide = (zxy, dz) => {
  const m = 2 ** (dz - 1)
  for (let dx = 0; dx < m; dx++) {
    for (let dy = 0; dy < m; dy++) {
      osmExport(zxy, [zxy[0] + dz, zxy[1] * 2 ** dz + m - dx - 1, zxy[2] * 2 ** dz + m - dy - 1])
      osmExport(zxy, [zxy[0] + dz, zxy[1] * 2 ** dz + m + dx,     zxy[2] * 2 ** dz + m - dy - 1])
      osmExport(zxy, [zxy[0] + dz, zxy[1] * 2 ** dz + m - dx - 1, zxy[2] * 2 ** dz + m + dy])
      osmExport(zxy, [zxy[0] + dz, zxy[1] * 2 ** dz + m + dx,     zxy[2] * 2 ** dz + m + dy])
    }
  }
}

divide([0, 0, 0], dz)
