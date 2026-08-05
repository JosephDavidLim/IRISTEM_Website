(function () {
    "use strict";

    var menuToggle = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-menu]");
    var dropdownToggles = document.querySelectorAll("[data-home-dropdown-toggle]");

    function setDropdownState(toggle, isOpen) {
        var dropdown = toggle.closest(".nav-dropdown");

        toggle.setAttribute("aria-expanded", String(isOpen));
        if (dropdown) dropdown.classList.toggle("is-open", isOpen);
    }

    function closeDropdowns(exceptToggle) {
        dropdownToggles.forEach(function (toggle) {
            if (toggle !== exceptToggle) setDropdownState(toggle, false);
        });
    }

    function closeMenu() {
        if (!menuToggle || !menu) return;
        menuToggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
        document.body.classList.remove("menu-open");
        closeDropdowns();
    }

    if (menuToggle && menu) {
        menuToggle.addEventListener("click", function () {
            var isOpen = menuToggle.getAttribute("aria-expanded") === "true";
            menuToggle.setAttribute("aria-expanded", String(!isOpen));
            menu.classList.toggle("is-open", !isOpen);
            document.body.classList.toggle("menu-open", !isOpen);
        });

        menu.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeMenu();
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > 1050) closeMenu();
        });
    }

    dropdownToggles.forEach(function (toggle) {
        toggle.addEventListener("click", function () {
            var isOpen = toggle.getAttribute("aria-expanded") === "true";

            closeDropdowns(toggle);
            setDropdownState(toggle, !isOpen);
        });
    });

    document.addEventListener("click", function (event) {
        if (!event.target.closest(".nav-dropdown")) closeDropdowns();
    });

    var revealItems = document.querySelectorAll(".reveal");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!("IntersectionObserver" in window) || reduceMotion) {
        revealItems.forEach(function (item) {
            item.classList.add("is-visible");
        });
    } else {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: "0px 0px -8% 0px",
            threshold: 0.08
        });

        revealItems.forEach(function (item) {
            observer.observe(item);
        });
    }

    document.querySelectorAll("[data-year]").forEach(function (item) {
        item.textContent = new Date().getFullYear();
    });

    var partnerCarousel = document.querySelector("[data-partner-carousel]");

    if (partnerCarousel) {
        var partnerTrack = partnerCarousel.querySelector("[data-partner-track]");
        var partnerCards = Array.prototype.slice.call(partnerTrack.children);
        var partnerCount = partnerCards.length;
        var partnerPrevious = partnerCarousel.querySelector("[data-partner-previous]");
        var partnerNext = partnerCarousel.querySelector("[data-partner-next]");
        var partnerIndex = 0;
        var partnerPhysicalIndex = 0;
        var partnerScrollFrame;
        var partnerScrollTimer;
        var partnerManualScrollTimer;
        var partnerProgrammaticScroll = false;
        var partnerTimer;

        partnerCards.forEach(function (card) {
            var clone = card.cloneNode(true);
            var cloneImage = clone.querySelector("img");

            clone.setAttribute("aria-hidden", "true");
            clone.setAttribute("role", "presentation");
            clone.removeAttribute("aria-label");
            if (cloneImage) cloneImage.setAttribute("alt", "");
            partnerTrack.appendChild(clone);
        });

        var allPartnerCards = Array.prototype.slice.call(partnerTrack.children);

        function getPartnerPosition(index) {
            return allPartnerCards[index].offsetLeft - allPartnerCards[0].offsetLeft;
        }

        function jumpToPartner(index) {
            partnerTrack.style.scrollBehavior = "auto";
            partnerTrack.scrollLeft = getPartnerPosition(index);
            partnerTrack.getBoundingClientRect();
            partnerTrack.style.scrollBehavior = "";
        }

        function finishPartnerMove(shouldReset) {
            window.clearTimeout(partnerScrollTimer);
            partnerScrollTimer = window.setTimeout(function () {
                if (shouldReset) {
                    partnerPhysicalIndex = 0;
                    jumpToPartner(0);
                }
                partnerProgrammaticScroll = false;
            }, reduceMotion ? 0 : 700);
        }

        function movePartnerForward() {
            partnerIndex = (partnerIndex + 1) % partnerCount;
            partnerPhysicalIndex += 1;
            partnerProgrammaticScroll = true;
            partnerTrack.scrollTo({
                left: getPartnerPosition(partnerPhysicalIndex),
                behavior: reduceMotion ? "auto" : "smooth"
            });
            finishPartnerMove(partnerPhysicalIndex === partnerCount);
        }

        function movePartnerBackward() {
            partnerProgrammaticScroll = true;

            if (partnerPhysicalIndex === 0) {
                partnerPhysicalIndex = partnerCount;
                jumpToPartner(partnerPhysicalIndex);
            }

            partnerIndex = (partnerIndex - 1 + partnerCount) % partnerCount;
            partnerPhysicalIndex -= 1;

            window.requestAnimationFrame(function () {
                partnerTrack.scrollTo({
                    left: getPartnerPosition(partnerPhysicalIndex),
                    behavior: reduceMotion ? "auto" : "smooth"
                });
                finishPartnerMove(false);
            });
        }

        function stopPartnerSlideshow() {
            window.clearInterval(partnerTimer);
        }

        function startPartnerSlideshow() {
            stopPartnerSlideshow();
            if (reduceMotion || document.hidden) return;

            partnerTimer = window.setInterval(function () {
                movePartnerForward();
            }, 3400);
        }

        partnerPrevious.addEventListener("click", function () {
            movePartnerBackward();
            startPartnerSlideshow();
        });

        partnerNext.addEventListener("click", function () {
            movePartnerForward();
            startPartnerSlideshow();
        });

        partnerTrack.addEventListener("scroll", function () {
            if (partnerProgrammaticScroll) return;
            window.cancelAnimationFrame(partnerScrollFrame);
            partnerScrollFrame = window.requestAnimationFrame(function () {
                var closestIndex = 0;
                var closestDistance = Infinity;

                allPartnerCards.forEach(function (card, index) {
                    var cardPosition = card.offsetLeft - allPartnerCards[0].offsetLeft;
                    var distance = Math.abs(partnerTrack.scrollLeft - cardPosition);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestIndex = index;
                    }
                });

                partnerPhysicalIndex = closestIndex;
                partnerIndex = closestIndex % partnerCount;

                window.clearTimeout(partnerManualScrollTimer);
                partnerManualScrollTimer = window.setTimeout(function () {
                    if (partnerPhysicalIndex >= partnerCount) {
                        partnerPhysicalIndex = partnerIndex;
                        partnerProgrammaticScroll = true;
                        jumpToPartner(partnerPhysicalIndex);
                        window.requestAnimationFrame(function () {
                            partnerProgrammaticScroll = false;
                        });
                    }
                }, 180);
            });
        }, { passive: true });

        document.addEventListener("visibilitychange", startPartnerSlideshow);

        window.addEventListener("resize", function () {
            partnerPhysicalIndex = partnerIndex;
            partnerProgrammaticScroll = true;
            jumpToPartner(partnerPhysicalIndex);
            window.requestAnimationFrame(function () {
                partnerProgrammaticScroll = false;
            });
            startPartnerSlideshow();
        });

        startPartnerSlideshow();

    }
}());
