window.addEventListener('DOMContentLoaded', () => {
    const servers   = JSON.parse(localStorage['servers'] || '{}');
    const plugins   = JSON.parse(localStorage['plugins'] || '{}');
    const username  = localStorage['username'];
    const authToken = localStorage['auth-token'];

    if (!servers) {
        localStorage['servers'] = JSON.stringify({});
    }

    if (!plugins) {
        localStorage['plugins'] = JSON.stringify({
            imdb: true,
            rottentomatoes: true
        });
    }

    if (username) {
        document.getElementById('username').value = username;
    }

    if (authToken) {
        document.getElementById('login').classList.remove('active');
        document.getElementById('settings').classList.add('active');

        listServers();
    }

    document.getElementById('sign-in').addEventListener('click', login);

    const pluginNodes = document.getElementsByName('plugin');

    for (let i = 0; i < pluginNodes.length; i++) {
        pluginNodes[i].checked = plugins[pluginNodes[i].value];
        pluginNodes[i].addEventListener('change', pluginChanged);
    }
});

function serverChanged () {
    const servers = JSON.parse(localStorage['servers'] || '{}');

    servers[this.value] = Object.assign({}, servers[this.value], {
        enable: this.checked
    });

    localStorage['servers'] = JSON.stringify(servers);
}

function pluginChanged () {
    const plugins = JSON.parse(localStorage['plugins'] || '{}');

    plugins[this.value] = this.checked;

    localStorage['plugins'] = JSON.stringify(plugins);
}

function login () {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    chrome.extension.getBackgroundPage()
        .login(username, password)
        .then((token) => {
            localStorage['auth-token'] = token;
            localStorage['username'] = username;

            document.getElementsByTagName('body')[0].classList.remove('preload');
            document.getElementById('login').classList.remove('active');
            document.getElementById('settings').classList.add('active');

            listServers();
        })
        .catch((error) => {
            console.error(error);
        });
}

function listServers () {
    const authToken = localStorage['auth-token'];

    if (!authToken) return; // TODO: Implement login redirect

    chrome.extension.getBackgroundPage()
        .getServers(authToken)
        .then(buildServerList)
        .catch((error) => {
            console.error(error);
        });
}

function buildServerList (servers) {
    const serversNode = document.getElementById('servers');
    const storage     = JSON.parse(localStorage['servers'] || '{}');

    serversNode.innerHTML = '';

    servers.forEach((server) => {
        const input   = document.createElement('input');
        const name    = document.createTextNode(server.name);
        const br      = document.createElement('br');

        storage[server.id] = Object.assign({}, storage[server.id], server);

        input.type    = 'checkbox';
        input.checked = storage[server.id] ? storage[server.id].enable : false;
        input.name    = 'server';
        input.value   = server.id;

        input.addEventListener('change', serverChanged);

        serversNode.appendChild(input);
        serversNode.appendChild(name);
        serversNode.appendChild(br);
    });

    localStorage['servers'] = JSON.stringify(storage);
}
