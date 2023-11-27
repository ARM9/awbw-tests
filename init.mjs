import {login, register} from './api.mjs';

export default async function init (user = 'test', password = 'test') {
    let cookies = await login(user, password);
    if (!cookies) {
        let email = `${user}@test.com`;
        let reg = await register(user, password, email);
        //let b = await reg.text();
        //console.log(b);
        cookies = await login(user, password)
        if (!cookies) {
            throw new Error(`Failed to register/login user: ${user} password: ${password} email: ${email}`)
        }
    }
    return cookies;
}

