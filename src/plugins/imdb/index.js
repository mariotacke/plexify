(() => {
	chrome.runtime.sendMessage({
		type: 'init',
		plugin: 'imdb'
	}, (response) => {
		if (response.active) {
			const extract = document
				.querySelector('.title_wrapper h1')
				.textContent
				.trim();

			const title = /^(.*)(?:\s\(\d{4}\))$/.exec(extract)[1];
			const year  = /^.*\((\d{4})\)$/g.exec(extract)[1];

			lookup(title, year);
		}
	})
})();

function lookup (title, year) {
	chrome.runtime.sendMessage({
		type: 'lookup',
		title,
		year
	}, (response) => {
		if (response.found) {
			const badge   = document.createElement('span');
			const divider = document.createElement('span');

			divider.className = 'ghost';
			divider.innerHTML = '|';

			badge.innerHTML = 'Available on Plex!';

			const subtext = document
				.querySelector('#title-overview-widget .subtext');

			subtext.appendChild(divider);
			subtext.appendChild(badge);
		}
	});
}
