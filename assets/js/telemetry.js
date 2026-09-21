(() => {
	if (window.location.origin !== "https://animated-barnacle-pz75q9k.pages.github.io" ||
		document.getElementById("app-insights-sdk")) {
		return;
	}

	const pageUrl = window.location.origin + window.location.pathname;
	let referrerOrigin = "";
	try {
		referrerOrigin = document.referrer ? new URL(document.referrer).origin : "";
	} catch {
		referrerOrigin = "";
	}

	const script = document.createElement("script");
	script.id = "app-insights-sdk";
	script.src = "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js";
	script.async = true;
	script.crossOrigin = "anonymous";
	script.referrerPolicy = "no-referrer";
	script.onload = () => {
		try {
			const appInsights = new Microsoft.ApplicationInsights.ApplicationInsights({
				config: {
					connectionString: "InstrumentationKey=49a880b5-7b01-4467-93d1-45b083bf6401;IngestionEndpoint=https://westus-0.in.applicationinsights.azure.com/;LiveEndpoint=https://westus.livediagnostics.monitor.azure.com/;ApplicationId=e42e6050-2851-4d14-b767-4e7b13ec1eaf",
					disableCookiesUsage: true,
					isStorageUseDisabled: true,
					enableSessionStorageBuffer: false,
					disableAjaxTracking: true,
					disableFetchTracking: true,
					disableExceptionTracking: true,
					enableAutoRouteTracking: false,
					autoTrackPageVisitTime: false,
					loggingLevelTelemetry: 0
				}
			});
			appInsights.loadAppInsights();
			appInsights.addTelemetryInitializer((item) => {
				if (item.baseType !== "PageviewData" && item.baseType !== "PageviewPerformanceData") {
					return false;
				}
				item.baseData.uri = pageUrl;
				item.baseData.refUri = referrerOrigin;
				if (item.ext && item.ext.trace) {
					item.ext.trace.name = window.location.pathname;
				}
			});
			appInsights.trackPageView({
				name: document.title,
				uri: pageUrl,
				refUri: referrerOrigin
			});
		} catch {
			console.warn("Site analytics could not be initialized.");
		}
	};
	document.head.appendChild(script);
})();