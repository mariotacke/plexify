function login (username, password) {
    return new Promise((resolve, reject) => {
        const xhr      = new XMLHttpRequest();
        const manifest = chrome.runtime.getManifest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                switch (xhr.status) {
                    case 201:
                        const token = xhr.responseXML
                            .getElementsByTagName('authentication-token')[0]
                            .childNodes[0]
                            .nodeValue;

                        resolve(token);
                        break;
                    case 401:
                        reject('Unauthorized');
                        break;
                    default:
                        reject(`Unhandled status code: ${xhr.status}`);
                        break;
                }
            }
        };

        xhr.open('POST', 'https://plex.tv/users/sign_in.xml', true);

        if (!localStorage['id']) {
            localStorage['id'] = Math.random().toString(36).slice(-40);
        }

        xhr.setRequestHeader('Authorization', `Basic ${btoa(`${username}:${password}`)}`);
        xhr.setRequestHeader('X-Plex-Client-Identifier', localStorage['id']);
        xhr.setRequestHeader('X-Plex-Platform', 'Chrome');
        xhr.setRequestHeader('X-Plex-Name', manifest.name);
        xhr.setRequestHeader('X-Plex-Device', 'Chrome');
        xhr.setRequestHeader('X-Plex-Device-Name', 'Plexify for Chrome');
        xhr.setRequestHeader('X-Plex-Product', 'Plexify (Chrome Extension)');
        xhr.setRequestHeader('X-Plex-Version', manifest.version);

        xhr.send();
    });
}

function getServers (token) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                switch (xhr.status) {
                    case 200:
                        const plexServers = Array.prototype.slice
                            .call(xhr.responseXML.getElementsByTagName('Server'))
                            .map((server) => {
                                return {
                                    id:      server.attributes['machineIdentifier'].value,
                                    name:    server.attributes['name'].value,
                                    scheme:  server.attributes['scheme'].value,
                                    address: server.attributes['address'].value,
                                    port:    server.attributes['port'].value,
                                    version: server.attributes['version'].value
                                }
                            });

                        resolve(plexServers);
                        break;
                    case 401:
                        reject('Unauthorized');
                        break;
                    default:
                        reject(`Unhandled status code: ${xhr.status}`);
                        break;
                }
            }
        };

        xhr.open('GET', 'https://plex.tv/pms/servers.xml', true);

        xhr.setRequestHeader('X-Plex-Token', token);

        xhr.send();
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case 'lookup':
            const storage = JSON.parse(localStorage['servers'] || '{}');
            const servers = Object.keys(storage)
                .filter((key) => {
                    return storage[key].enable;
                })
                .map((key) => {
                    return storage[key];
                });

            lookup(request.title, request.year, servers)
                .then((results) => {
                    sendResponse({
                        found: results.some((result) => result.length)
                            ? true : false
                    });
                })
                .catch((error) => {
                    sendResponse({
                        found: false
                    });
                });

            break;
        case 'init':
            const plugins = JSON.parse(localStorage['plugins'] || '{}');

            sendResponse({
                active: plugins[request.plugin]
            });

            break;
        default:
            break;
    }

    return true;
});

function lookup (title, year, servers) {
    const token = localStorage['token'];

    const requests = servers.map((server) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    switch (xhr.status) {
                        case 0:
                            resolve([]);
                            break;
                        case 200:
                            const results = JSON.parse(xhr.response)._children
                                .filter((result) => {
                                    return result._elementType === 'Video' &&
                                        result.year == year;
                                });

                            resolve(results);
                            break;
                        case 401:
                            reject('Unauthorized');
                            break;
                        default:
                            reject(`Unhandled status code: ${xhr.status}`);
                            break;
                    }
                }
            };

            xhr.open('GET', `${server.scheme}://${server.address}:${server.port}/search?query=${title}`, true);

            xhr.setRequestHeader('X-Plex-Token', token);
            xhr.setRequestHeader('Accept', 'application/json');

            xhr.timeout = 3000;

            xhr.send();
        });
    })

    return Promise.all(requests);
}
