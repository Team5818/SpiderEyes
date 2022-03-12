import "./css";

import(/* webpackPrefetch: true */ "./app-mount")
    .then(x => x.mountApp())
    .catch(e => console.error(e));
