'use strict';

/**
 * PWA service worker of Red Cherry (https://redcherry.ir)
 * Code By : Ali Rahimi (https://alirahimi818.ir)
 * learn more in Github : https://github.com/alirahimi818/simple-PWA
 */

var cache_storage_name = 'redcherry-pwa-1.0';
var start_page = 'index.html';
var offline_page = 'offline.html';
var first_cache_urls = [start_page, offline_page];
var never_cache_urls = [/\/private.html/, /\/panel/, /\/custom-url/];

// Install 
self.addEventListener('install', function (e) {
	console.log('PWA sw installation');
	e.waitUntil(caches.open(cache_storage_name).then(function (cache) {
		console.log('PWA sw caching first urls');
		first_cache_urls.map(function (url) {
			return cache.add(url).catch(function (res) {
				return console.log('PWA: ' + String(res) + ' ' + url);
			});
		});
	}));
});

// Activate
self.addEventListener('activate', function (e) {
	console.log('PWA sw activation');
	e.waitUntil(caches.keys().then(function (kl) {
		return Promise.all(kl.map(function (key) {
			if (key !== cache_storage_name) {
				console.log('PWA old cache removed', key);
				return caches.delete(key);
			}
		}));
	}));
	return self.clients.claim();
});

// Fetch
self.addEventListener('fetch', function (e) {

	if (!checkFetchRules(e)) return;

	// Strategy for online user
	if (e.request.mode === 'navigate' && navigator.onLine) {
		e.respondWith(fetch(e.request).then(function (response) {
			return caches.open(cache_storage_name).then(function (cache) {
				if (never_cache_urls.every(check_never_cache_urls, e.request.url)) {
					cache.put(e.request, response.clone());
				}
				return response;
			});
		}));
		return;
	}

	// Strategy for offline user
	e.respondWith(caches.match(e.request).then(function (response) {
		return response || fetch(e.request).then(function (response) {
			return caches.open(cache_storage_name).then(function (cache) {
				if (never_cache_urls.every(check_never_cache_urls, e.request.url)) {
					cache.put(e.request, response.clone());
				}
				return response;
			});
		});
	}).catch(function () {
		return caches.match(offline_page);
	}));
});

// Check never cache urls 
function check_never_cache_urls(url) {
	if (this.match(url)) {
		return false;
	}
	return true;
}

// Fetch Rules
function checkFetchRules(e) {

	// Check request url from inside domain.
	if (new URL(e.request.url).origin !== location.origin) return;

	// Check request url http or https
	if (!e.request.url.match(/^(http|https):\/\//i)) return;

	// Show offline page for POST requests
	if (e.request.method !== 'GET') {
		return caches.match(offline_page);
	}

	return true;
}

importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js");
if (workbox.googleAnalytics) {
	try {
		workbox.googleAnalytics.initialize();
	} catch (e) {
		console.log(e.message);
	}
}