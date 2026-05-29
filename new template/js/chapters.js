(function () {
	"use strict";

	const chapters = {
		harker: {
			school: "The Harker School",
			address: "San Jose, CA",
			president: "Chapter President (Placeholder)",
			email: "team@iristem.org",
			initials: "HS",
		},
		mitty: {
			school: "Archbishop Mitty High School",
			address: "San Jose, CA",
			president: "Chapter President (Placeholder)",
			email: "team@iristem.org",
			initials: "AM",
		},
		saint-francis: {
			school: "Saint Francis High School",
			address: "Mountain View, CA",
			president: "Chapter President (Placeholder)",
			email: "team@iristem.org",
			initials: "SF",
		},
		sacred-heart: {
			school: "Sacred Heart Cathedral Preparatory",
			address: "San Francisco, CA",
			president: "Chapter President (Placeholder)",
			email: "team@iristem.org",
			initials: "SH",
		},
		leland: {
			school: "Leland High School",
			address: "San Jose, CA",
			president: "Chapter President (Placeholder)",
			email: "team@iristem.org",
			initials: "LH",
		},
		irvington: {
			school: "Irvington High School",
			address: "Fremont, CA",
			president: "Chapter President (Placeholder)",
			email: "team@iristem.org",
			initials: "IH",
		},
		sample: {
			school: "Chapter Name",
			address: "City, State / Country",
			president: "Chapter President (Placeholder)",
			email: "team@iristem.org",
			initials: "CH",
		},
	};

	function safeText(id, value) {
		const el = document.getElementById(id);
		if (el) el.textContent = value;
	}

	function safeMailLink(id, email) {
		const el = document.getElementById(id);
		if (!el) return;
		el.textContent = email;
		el.setAttribute("href", `mailto:${email}`);
	}

	function applyChapter(chapter) {
		safeText("chapterSchool", chapter.school);
		safeText("chapterAddress", chapter.address);
		safeText("chapterPresident", chapter.president);
		safeMailLink("chapterEmail", chapter.email);
		safeMailLink("chapterPresidentLink", chapter.email);

		const logoEl = document.getElementById("chapterLogo");
		if (logoEl) {
			logoEl.setAttribute("data-initials", chapter.initials || "");
		}

		document.title = `IRISTEM | ${chapter.school}`;
	}

	function getChapterId() {
		try {
			const params = new URLSearchParams(window.location.search);
			return params.get("id");
		} catch (e) {
			return null;
		}
	}

	const id = getChapterId();
	const chapter = (id && chapters[id]) ? chapters[id] : chapters.harker;
	applyChapter(chapter);
})();

