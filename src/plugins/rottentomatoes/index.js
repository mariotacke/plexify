(() => {
	chrome.runtime.sendMessage({
		type: 'init',
		plugin: 'rottentomatoes'
	}, (response) => {
		if (response.active) {
			const extract = document
				.querySelector('[data-type="title"]')
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
			const badge = document.createElement('div');
			const label = document.createElement('span');

			badge.className = 'superPageFontColor';
			label.className = 'subtle superPageFontColor';

			label.innerHTML = 'Available on Plex!';

			badge.appendChild(label);

			document.getElementById('scoreStats').appendChild(badge);
		}
	});
}
