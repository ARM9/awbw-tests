## AWBW frontend tests

#### Test coverage:
* upload.php
* and that's it for now

#### Running tests
Run `npm test`, default endpoint is `http://awbw.test`

Test against a different host by setting `AWBW_URL` in your env, or pass the
URL as an argument.

`AWBW_URL='http://awbw.test' npm test`

`npm test http://awbw.test`

The second form might change.

----
todo use a real testing framework
