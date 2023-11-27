import {JSDOM} from 'jsdom';

let awbw_url = process.env.AWBW_URL || 'http://awbw.test';

let Cookie = 'PHPSESSID=8134197c58561a896919b161c6311318';
let headers = {
            'Accept': '*/*',
            'Cookie': Cookie,
            'Connection': 'keep-alive',
            //'Host': 'localhost',
            'Origin': awbw_url,
            'Referer': `${awbw_url}/`,
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 awbw-test/1.0'
        };

/* @param {string} - url to your testing environment
 */
function setHost (url) {
    awbw_url = url;
    headers['Origin'] = url;
    headers['Referer'] = `${url}/`;
}
/* @param {string} - Cookie string 'key1=val;key2=val'
 */
function setCookies (cookies) {
    headers['Cookie'] = cookies;
}

async function login (username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    let logincheck = await fetch(`${awbw_url}/logincheck.php`,{
        method: 'POST',
        headers: {
            ...headers,
        },
        body: formData
    }),
        success = await logincheck.json();
    if (!success) return 0;
    let cookies = logincheck.headers.get('set-cookie');
    return cookies;
}

async function register (username, password, email) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('email', email);

    let res = await fetch(`${awbw_url}/register.php`,{
        method: 'POST',
        headers: {
            ...headers,
        },
        body: formData
    });
    return res;
}

async function getMapJson (id) {
    let map_info = await fetch(`${awbw_url}/api/map/map_info.php?maps_id=${id}`);
    return map_info.json();
}

async function getMapCsv (id) {
    let res = await fetch(`${awbw_url}/text_map.php?maps_id=${id}`),
        html = await res.text(),
        dom = new JSDOM(html),
        map_text = dom.window.document.querySelector('tr > td > table > tbody').textContent;
    return map_text.split('\n').filter(s => s).join('\n');
}

function convertJsonToCsv (json) {
    let map_data = json['Terrain Map'],
        csv = map_data[0].map((_, i) => map_data.map(row => row[i])).map(row => row.join(',')).join('\n');
    return csv;
}

async function editMap (id) {
    let res = await fetch(`${awbw_url}/api/map/designmap.php`,{
            method: 'POST',
            body: JSON.stringify({
                method: "initializeMap",
                mapId: id
            })
        });
    return res.json();
}

async function saveMap (mapId, size_x, size_y, tiles, units) {
    let res = await fetch(`${awbw_url}/api/map/designmap.php`,{
            method: 'POST',
            body: JSON.stringify({
                method: 'saveMap',
                mapId,
                mapDims: {
                    x: size_x,
                    y: size_y
                },
                tiles,
                units
            })
        });
    return res.json();
}

async function uploadMap (name, csv, overwrite = 'new') {
    const formData = new FormData();
    formData.append('action', 'UPLOAD');
    formData.append('mapfile', new Blob([csv], {type: 'text/plain'}), 'map.txt');
    formData.append('name', name);
    formData.append('format', 'AWBW');
    formData.append('overwrite', overwrite);
    formData.append('submit', 'Upload');

    let new_map_id;
    try {
        let upload = await fetch(`${awbw_url}/uploadmap.php`, {
                method: 'POST',
                headers,
                body: formData
            }),
            upload_response = await upload.text();

        new_map_id = upload_response.match(/href="design.php#map_(\d+)"/);
    } catch (e) {
        return [null, e];
    }

    if (!new_map_id) return [null, `uploadMap failed: ${name}`];

    return [new_map_id[1], null];
}
async function createMap (name, width, height) {
    const formData = new FormData();
    formData.append('maps_name', name);
    formData.append('maps_height', height);
    formData.append('maps_width', width);
    formData.append('maps_new', 1);
    formData.append('submit', 'Submit');

    let upload = await fetch(`${awbw_url}/design.php`, {
            method: 'POST',
            headers,
            body: formData
        }),
        upload_response = await upload.text(),
        new_map_id = upload_response.match(new RegExp(`href=prevmaps.php\\?maps_id=(\\d+)>${name}`));

    if (!new_map_id) throw new Error(`createMap failed: ${name} ${width}x${height}`);
    // assuming map name doesn't match an existing map
    return new_map_id[1];
}

async function deleteMap (id) {
    return fetch(`${awbw_url}/design.php?reallydelete=1&maps_id=${id}`, {headers});
}

function convertStolenUnitsToEditorUnits (units) {
    return units.map(unit => ({
        units_code: unit['Country Code'],
        units_id: unit['Unit ID'],
        //units_image: '',
        //units_left: unit['Unit X']*16,
        //units_top: unit['Unit Y']*16,
        units_x: unit['Unit X'],
        units_y: unit['Unit Y']
    }));
}

export {setHost, setCookies, login, register, getMapJson, getMapCsv, convertJsonToCsv, editMap, saveMap, createMap, uploadMap, deleteMap};
