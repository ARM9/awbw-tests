import {login, register, setHost} from './api.mjs';

export default async function init ({username = 'test', password = 'test', host = 'http://awbw.test'} = {}) {
    setHost(host);
    let cookies = await login(username, password);
    if (!cookies) {
        let email = `${username}@test.com`;
        let reg = await register(username, password, email);
        cookies = await login(username, password)
        if (!cookies) {
            throw new Error(`Failed to register/login username: ${username} password: ${password} email: ${email}`)
        }
    }
    return cookies;
}

