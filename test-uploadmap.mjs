import {login, register, getMapJson, getMapCsv, convertJsonToCsv, createMap, uploadMap, deleteMap} from './api.mjs';
import init from './init.mjs';
import fs from 'fs';

let host = process.argv[2] || process.env.AWBW_URL || 'http://awbw.test',
    username = process.env.AWBW_USER || 'test',
    password = process.env.AWBW_PASS || 'test';
let login_cookies = await init({username, password, host});
//console.log(login_cookies);

const PASSED = "\x1b[32mPASSED\x1b[39m",
      FAILED = "\x1b[31mFAILED\x1b[39m";

const maps_dir = './maps/';
let map_files = fs.readdirSync(maps_dir).filter(f => !f.match('~')),
    valid = map_files.filter(f => f.match(/^valid/)),
    invalid = map_files.filter(f => f.match(/^invalid/));

const DELAY = process.env.DELAY || 1000;

console.log('\n---- Testing invalid maps ----');
await testUploadInvalid(invalid);

console.log('\n---- Testing valid maps ----');
await testUploadValid(valid);

async function testUploadMap (fname, csv, overwrite = 'new') {
    let pt = performance.now();
    const [id, err] = await uploadMap(fname, csv, overwrite);
    let time = (performance.now() - pt)/1000;
    return {id, err, time};
}

function readCsv (fname) {
    return fs.readFileSync(maps_dir + fname, 'utf-8')
             .trim().split('\n').filter(s => s)
             .map(s => s.trim()).join('\n');
}

async function testUploadInvalid (maps) {
    for (let i = 0; i < maps.length; i++) {
        await sleep(DELAY);
        console.log();
        const fname = maps[i],
              csv = readCsv(fname),
              {id, err, time} = await testUploadMap(fname, csv);
        if (err) {
            console.log(`${err} ${time} seconds`);
            console.log(fname, PASSED);
            continue;
        }
        console.error(`Uploaded ${fname} ${id} in ${time} seconds`);

        let exported_csv = await getMapCsv(id);

        console.error(fname + ':\n' + csv);
        console.error('Exported csv:\n' + exported_csv);
        console.error(fname, FAILED);
        //process.exit();
    }
}

async function testUploadValid (maps) {
    let map_id = await createMap('valid test', 5, 5);

    for (let i = 0; i < maps.length; i++) {
        await sleep(DELAY);
        console.log();
        const fname = maps[i],
              csv = readCsv(fname),
              {id, err, time} = await testUploadMap(fname, csv, map_id);
        if (err) {
            console.error(`${err} ${time} seconds`);
            console.error(csv);
            console.error(fname, FAILED);
            continue;
        }
        console.log(`Uploaded ${fname} ${id} in ${time} seconds`);

        let exported_csv = await getMapCsv(id),
            success = exported_csv === csv;
        if (!success) {
            console.error(fname + ':\n' + csv);
            console.error('Exported csv:\n' + exported_csv);
            console.error(`Error: ${fname} not identical to exported map!`)
            console.error(fname, FAILED);
            continue;
        }
        console.log(fname, PASSED);
    }
    console.log(`Deleting ${map_id}`)
    await deleteMap(map_id);
}

async function testExportJsonEqualsCsv (id) {
    let json = await getMapJson(id),
        to_csv = convertJsonToCsv(json),
        csv = await getMapCsv(id);
    console.log(id, csv === to_csv);
}

async function sleep (ms) {
    return new Promise(r => setTimeout(r, ms));
}

process.exit();

