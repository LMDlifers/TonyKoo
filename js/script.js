$(document).ready(function () {
  const prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  const scrollAnimationDuration = prefersReducedMotion ? 0 : 220;
  const scrollOffset = 16;

  function scrollToTarget(target, duration = scrollAnimationDuration) {
    const $target = $(target);

    if (!$target.length) return;

    const navHeight = $("#navigation").outerHeight() || 0;
    const targetPosition = Math.max(
      $target.offset().top - navHeight - scrollOffset,
      0
    );

    $("html, body").stop(true);

    if (!duration) {
      window.scrollTo(0, targetPosition);
      return;
    }

    $("html, body").stop(true).animate(
      {
        scrollTop: targetPosition,
      },
      duration
    );
  }

  // Loading Screen
  const loadingFacts = [
    "Fun fact: FAISS makes similarity search over embeddings fast enough for practical retrieval workflows.",
    "Fun fact: Bass diffusion models split adoption into innovation effects and imitation effects.",
    "Fun fact: behavioral finance studies how psychology leaks into market prices.",
    "Fun fact: a yield curve is a compact snapshot of market expectations across maturities.",
    "Fun fact: human review gates make AI workflows easier to audit when decisions are sensitive.",
    "Fun fact: scenario analysis is less about predicting one future and more about stress-testing assumptions.",
  ];
  const loadingFact = $("#loadingFact");
  let loadingFactIndex = Math.floor(Math.random() * loadingFacts.length);
  let loadingFactTimer;

  $(".filterItemImg").attr("loading", "lazy").attr("decoding", "async");
  let loadingScreenHidden = false;
  const loadingStartedAt = Date.now();
  const minimumLoadingTime = prefersReducedMotion ? 0 : 650;

  function showLoadingFact(index) {
    if (!loadingFact.length) return;

    loadingFact.addClass("fact-changing");
    setTimeout(function () {
      loadingFact.text(loadingFacts[index]);
      loadingFact.removeClass("fact-changing");
    }, 180);
  }

  showLoadingFact(loadingFactIndex);
  if (!prefersReducedMotion) {
    loadingFactTimer = setInterval(function () {
      loadingFactIndex = (loadingFactIndex + 1) % loadingFacts.length;
      showLoadingFact(loadingFactIndex);
    }, 1200);
  }

  function hideLoadingScreen() {
    if (loadingScreenHidden) return;

    const elapsed = Date.now() - loadingStartedAt;
    const remainingTime = Math.max(minimumLoadingTime - elapsed, 0);

    setTimeout(function () {
      if (loadingScreenHidden) return;
      loadingScreenHidden = true;
      $("#loadingScreen").addClass("hidden");
      clearInterval(loadingFactTimer);
    }, remainingTime);
  }

  $(window).on("load", hideLoadingScreen);
  setTimeout(hideLoadingScreen, prefersReducedMotion ? 100 : 1400);

  // Dark Mode Toggle
  const darkModeToggle = $("#darkModeToggle");
  const body = $("body");

  // Check for saved dark mode preference
  if (localStorage.getItem("darkMode") === "enabled") {
    body.addClass("dark-mode");
  }

  darkModeToggle.on("click", function () {
    body.toggleClass("dark-mode");

    // Save preference
    if (body.hasClass("dark-mode")) {
      localStorage.setItem("darkMode", "enabled");
    } else {
      localStorage.setItem("darkMode", "disabled");
    }
  });

  // Search Functionality
  const searchInput = $("#searchInput");
  const searchResults = $("#searchResults");
  let searchTimeout;

  // Searchable content
  const searchableContent = [];

  // Index all searchable content
  function indexContent() {
    // Index resume sections
    $(".resumeSubsection").each(function () {
      const $section = $(this);
      const title = $section.find(".resumeName").text();
      const role = $section.find(".resumeRole").text();
      const content = $section.text().substring(0, 200);
      const id = $section.closest("section").attr("id");

      if (title) {
        searchableContent.push({
          title: title,
          subtitle: role,
          content: content,
          element: $section,
          section: id,
        });
      }
    });

    // Index portfolio items
    $(".filterItem").each(function () {
      const $item = $(this);
      const title = $item.find(".filterItemName").text();
      const content = $item.find(".filterItemDesc").text().substring(0, 200);

      if (title) {
        searchableContent.push({
          title: title,
          subtitle: "Portfolio Project",
          content: content,
          element: $item,
          section: "portfolio",
        });
      }
    });

    // Index skills
    $(".resumeSkill").each(function () {
      const skill = $(this).text();
      searchableContent.push({
        title: skill,
        subtitle: "Skill",
        content: "",
        element: $(this),
        section: "resume",
      });
    });

    // Index testimonials
    $(".testimonialCard").each(function () {
      const $card = $(this);
      const name = $card.find(".testimonialName").text();
      const company = $card.find(".testimonialCompany").text();
      const content = $card.find(".testimonialQuote p").text().substring(0, 200);

      if (name) {
        searchableContent.push({
          title: name,
          subtitle: "Testimonial from " + company,
          content: content,
          element: $card,
          section: "testimonials",
        });
      }
    });

    // Index reading and research diet
    $(".bookThumb").each(function () {
      const $book = $(this);
      const title = $book.data("title");
      const author = $book.data("author");
      const theme = $book.data("theme");
      const takeaway = $book.data("takeaway");

      if (title) {
        searchableContent.push({
          title: title,
          subtitle: "Book: " + author,
          content: [theme, author, takeaway].join(" "),
          element: $book.closest(".bookCarousel"),
          section: "reading",
        });
      }
    });

    // Index writing/articles
    $(".writingCard").each(function () {
      const $card = $(this);
      const title = $card.find(".writingTitle a").text();
      const content = $card.find(".writingExcerpt").text().substring(0, 200);

      if (title) {
        searchableContent.push({
          title: title,
          subtitle: "Technical Writing",
          content: content,
          element: $card,
          section: "writing",
        });
      }
    });

    // Index certifications
    $(".certCard").each(function () {
      const $card = $(this);
      const title = $card.find(".certTitle").text();
      const issuer = $card.find(".certIssuer").text();
      const content = $card.find(".certTopics").text();

      if (title) {
        searchableContent.push({
          title: title,
          subtitle: "Certification from " + issuer,
          content: content,
          element: $card,
          section: "certifications",
        });
      }
    });

    // Index technical expertise
    $(".expertiseCategory").each(function () {
      const $cat = $(this);
      const title = $cat.find(".expertiseTitle").text();
      const content = $cat.find(".expertiseList").text().substring(0, 200);

      if (title) {
        searchableContent.push({
          title: title,
          subtitle: "Technical Expertise",
          content: content,
          element: $cat,
          section: "resume",
        });
      }
    });
  }

  indexContent();

  searchInput.on("input", function () {
    clearTimeout(searchTimeout);
    const query = $(this).val().trim().toLowerCase();

    if (query.length < 2) {
      searchResults.removeClass("active").html("");
      return;
    }

    searchTimeout = setTimeout(function () {
      performSearch(query);
    }, 300);
  });

  function performSearch(query) {
    const results = searchableContent.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query)
      );
    });

    displayResults(results, query);
  }

  function displayResults(results, query) {
    if (results.length === 0) {
      searchResults
        .html('<div class="no-results">No results found</div>')
        .addClass("active");
      return;
    }

    let html = "";
    results.slice(0, 8).forEach((result) => {
      const highlightedTitle = highlightText(result.title, query);
      const highlightedContent = highlightText(
        result.content.substring(0, 100),
        query
      );

      html += `
                <div class="search-result-item" data-section="${
                  result.section
                }">
                    <div class="search-result-title">${highlightedTitle}</div>
                    <div class="search-result-context">${result.subtitle}</div>
                    ${
                      highlightedContent
                        ? `<div class="search-result-context">${highlightedContent}...</div>`
                        : ""
                    }
                </div>
            `;
    });

    searchResults.html(html).addClass("active");

    // Handle result click
    $(".search-result-item").on("click", function () {
      const section = $(this).data("section");
      scrollToTarget("#" + section, prefersReducedMotion ? 0 : 300);

      searchResults.removeClass("active");
      searchInput.val("");
    });
  }

  function highlightText(text, query) {
    if (!text) return "";
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(
      regex,
      '<span class="search-result-highlight">$1</span>'
    );
  }

  // Close search results when clicking outside
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".search-container").length) {
      searchResults.removeClass("active");
    }
  });

  // Sidebar Toggle
  const sidebar = $("#quickJumpSidebar");
  const sidebarToggle = $("#sidebarToggle");
  let currentActiveSection = "";

  function updateActiveSection(sectionId) {
    if (!sectionId || sectionId === currentActiveSection) return;

    currentActiveSection = sectionId;
    $(".sidebar-link").removeClass("active-section").removeAttr("aria-current");
    $(`.sidebar-link[data-section="${sectionId}"]`)
      .addClass("active-section")
      .attr("aria-current", "location");
    $("#navigation .nav-link").removeClass("active-section").removeAttr("aria-current");
    $(`#navigation .nav-link[href="#${sectionId}"]`)
      .addClass("active-section")
      .attr("aria-current", "location");
  }

  sidebarToggle.on("click", function (e) {
    e.stopPropagation();
    sidebar.toggleClass("active");
  });

  // Close sidebar when clicking outside
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".quick-jump-sidebar").length) {
      sidebar.removeClass("active");
    }
  });

  // Update active section in sidebar on scroll
  $(window).on("scroll", function () {
    const scrollPos = $(window).scrollTop() + 100;
    let activeSectionId = "";

    $("section[id]").each(function () {
      const section = $(this);
      const sectionTop = section.offset().top;
      const sectionBottom = sectionTop + section.outerHeight();
      const sectionId = section.attr("id");

      if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
        activeSectionId = sectionId;
      }
    });

    updateActiveSection(activeSectionId);
  });

  $(window).trigger("scroll");

  // Sidebar link clicks
  $(".sidebar-link").on("click", function (e) {
    e.preventDefault();
    const target = $(this).attr("href");
    scrollToTarget(target);

    sidebar.removeClass("active");
  });

  $(".heroButton[href^='#']").on("click", function (e) {
    e.preventDefault();
    scrollToTarget($(this).attr("href"), prefersReducedMotion ? 0 : 300);
  });

  // Reading bookshelf carousel
  const bookCarousel = $("[data-book-carousel]");
  if (bookCarousel.length) {
    const bookThumbs = bookCarousel.find(".bookThumb");
    const bookCoverFrame = bookCarousel.find(".bookCoverFrame");
    const bookCoverImage = $("#bookCoverImage");
    const bookTheme = $("#bookTheme");
    const bookTitle = $("#bookTitle");
    const bookAuthor = $("#bookAuthor");
    const bookTakeaway = $("#bookTakeaway");
    const fallbackTitle = bookCarousel.find(".fallbackTitle");
    const fallbackAuthor = bookCarousel.find(".fallbackAuthor");
    let activeBookIndex = 0;

    bookCarousel.attr("tabindex", "0");

    bookThumbs.each(function () {
      const cover = $(this).data("cover");
      if (cover) {
        const image = new Image();
        image.src = cover;
      }
    });

    function updateBook(index, direction) {
      if (!bookThumbs.length) return;

      const nextIndex = (index + bookThumbs.length) % bookThumbs.length;
      const thumb = bookThumbs.eq(nextIndex);
      const title = thumb.data("title");
      const author = thumb.data("author");
      const theme = thumb.data("theme");
      const takeaway = thumb.data("takeaway");
      const cover = thumb.data("cover");
      const flipClass = direction === "backward" ? "flip-backward" : "flip-forward";

      bookCoverFrame.removeClass("flip-forward flip-backward");
      void bookCoverFrame[0].offsetWidth;
      bookCoverFrame.addClass(flipClass);

      bookCoverImage.removeClass("is-hidden").attr({
        src: cover,
        alt: "Book cover: " + title + " by " + author,
      });
      bookTheme.text(theme);
      bookTitle.text(title);
      bookAuthor.text(author);
      bookTakeaway.text(takeaway);
      fallbackTitle.text(title);
      fallbackAuthor.text(author);

      bookThumbs.removeClass("active").removeAttr("aria-current");
      thumb.addClass("active").attr("aria-current", "true");

      if (thumb[0] && thumb[0].scrollIntoView) {
        thumb[0].scrollIntoView({
          behavior: "auto",
          block: "nearest",
          inline: "center",
        });
      }

      activeBookIndex = nextIndex;
    }

    bookCoverImage.on("error", function () {
      $(this).addClass("is-hidden");
    });

    bookThumbs.find("img").on("error", function () {
      $(this).hide();
    });

    bookCarousel.find(".bookNavPrev").on("click", function () {
      updateBook(activeBookIndex - 1, "backward");
    });

    bookCarousel.find(".bookNavNext").on("click", function () {
      updateBook(activeBookIndex + 1, "forward");
    });

    bookThumbs.on("click", function () {
      const selectedIndex = bookThumbs.index(this);
      const direction = selectedIndex < activeBookIndex ? "backward" : "forward";
      updateBook(selectedIndex, direction);
    });

    bookCarousel.on("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        updateBook(activeBookIndex - 1, "backward");
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        updateBook(activeBookIndex + 1, "forward");
      }
    });
  }

  // Consolidated project flashcard deck
  const projectDeck = $("[data-project-deck]");
  if (projectDeck.length) {
    const categoryLabels = {
      ai: "AI",
      quant: "Quant",
      data: "Data",
      apps: "Apps",
      research: "Research",
    };
    const projectDeckCard = projectDeck.find(".projectDeckCard");
    const projectDeckImage = $("#projectDeckImage");
    const projectDeckCategories = $("#projectDeckCategories");
    const projectDeckTitle = $("#projectDeckTitle");
    const projectDeckProblem = $("#projectDeckProblem");
    const projectDeckBuilt = $("#projectDeckBuilt");
    const projectDeckEvidence = $("#projectDeckEvidence");
    const projectDeckTech = $("#projectDeckTech");
    const projectDeckLink = $("#projectDeckLink");
    const projectDeckCounter = $("#projectDeckCounter");
    const projectDeckRail = $("#projectDeckRail");
    const projectGridWrap = $("#projectGridWrap");
    const projectEvidenceIndex = $(".projectEvidenceIndex");
    const projectViewButtons = projectDeck.find("[data-project-view]");
    let activeProjectIndex = 0;
    let visibleProjects = [];

    function cleanProjectText($element, label) {
      return $element.text().replace(/\s+/g, " ").replace(new RegExp("^" + label + ":\\s*", "i"), "").trim();
    }

    const projectData = $(".filterItem")
      .map(function (index) {
        const $project = $(this);
        const $image = $project.find(".filterItemImg").first();
        const $primaryLink = $project.find(".filterItemReport .filterItemLink").first().length
          ? $project.find(".filterItemReport .filterItemLink").first()
          : $project.find(".filterItemLink").first();
        const categories = Object.keys(categoryLabels).filter(function (category) {
          return $project.hasClass(category);
        });

        return {
          index: index,
          title: cleanProjectText($project.find(".filterItemName").first(), ""),
          image: $image.attr("src") || "",
          imageAlt: $image.attr("alt") || "",
          categories: categories,
          problem: cleanProjectText($project.find(".filterItemProblem").first(), "Problem"),
          built: cleanProjectText($project.find(".filterItemArchitecture").first(), "Built"),
          evidence: cleanProjectText($project.find(".filterItemResults").first(), "Evidence"),
          tech: $project.find(".techBadge").map(function () {
            return $(this).text().trim();
          }).get(),
          linkHref: $primaryLink.attr("href") || "",
          linkText: cleanProjectText($primaryLink, "") || "Open project detail",
        };
      })
      .get();

    function matchesProjectFilter(project, filter) {
      return !filter || filter === "all" || project.categories.indexOf(filter) > -1;
    }

    function isExternalProjectLink(href) {
      return /^https?:\/\//i.test(href);
    }

    function renderProjectRail() {
      projectDeckRail.empty();

      visibleProjects.forEach(function (project, index) {
        const thumb = $("<button>", {
          type: "button",
          class: "projectDeckThumb",
          text: project.title,
          "aria-label": "Show " + project.title,
        });

        if (index === activeProjectIndex) {
          thumb.addClass("active").attr("aria-current", "true");
        }

        thumb.on("click", function () {
          const direction = index < activeProjectIndex ? "backward" : "forward";
          activeProjectIndex = index;
          renderProjectCard(direction);
        });

        projectDeckRail.append(thumb);
      });
    }

    function renderProjectCard(direction) {
      if (!visibleProjects.length) {
        projectDeck.addClass("is-empty");
        return;
      }

      const project = visibleProjects[activeProjectIndex];
      const flipClass = direction === "backward" ? "flip-backward" : "flip-forward";

      projectDeck.removeClass("is-empty");
      projectDeckCard.removeClass("flip-forward flip-backward");
      void projectDeckCard[0].offsetWidth;
      projectDeckCard.addClass(flipClass);

      projectDeckImage.attr({
        src: project.image,
        alt: project.imageAlt || project.title,
      });
      projectDeckCategories.empty();
      project.categories.forEach(function (category) {
        projectDeckCategories.append(
          $("<span>", {
            class: "projectDeckCategory",
            text: categoryLabels[category] || category,
          })
        );
      });
      projectDeckTitle.text(project.title);
      projectDeckProblem.text(project.problem || "See the full card for project context.");
      projectDeckBuilt.text(project.built || "See the full card for implementation details.");
      projectDeckEvidence.text(project.evidence || "See the full card for public evidence boundaries.");
      projectDeckTech.empty();
      project.tech.slice(0, 7).forEach(function (tech) {
        projectDeckTech.append($("<span>", { text: tech }));
      });

      if (project.linkHref) {
        projectDeckLink.removeClass("is-hidden").attr("href", project.linkHref).text(project.linkText);
        if (isExternalProjectLink(project.linkHref)) {
          projectDeckLink.attr({
            target: "_blank",
            rel: "noopener",
          });
        } else {
          projectDeckLink.removeAttr("target").removeAttr("rel");
        }
      } else {
        projectDeckLink.addClass("is-hidden").attr("href", "#").removeAttr("target").removeAttr("rel");
      }

      projectDeckCounter.text(activeProjectIndex + 1 + " / " + visibleProjects.length);
      renderProjectRail();
    }

    function moveProject(delta) {
      if (!visibleProjects.length) return;

      activeProjectIndex = (activeProjectIndex + delta + visibleProjects.length) % visibleProjects.length;
      renderProjectCard(delta < 0 ? "backward" : "forward");
    }

    window.updateProjectDeckFilter = function (filter) {
      visibleProjects = projectData.filter(function (project) {
        return matchesProjectFilter(project, filter);
      });
      activeProjectIndex = 0;
      renderProjectCard("forward");
    };

    projectDeck.find(".projectDeckPrev").on("click", function () {
      moveProject(-1);
    });

    projectDeck.find(".projectDeckNext").on("click", function () {
      moveProject(1);
    });

    projectDeck.on("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveProject(-1);
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveProject(1);
      }
    });

    projectDeck.attr("tabindex", "0");

    function setProjectView(view) {
      const isGridView = view === "grid";

      projectDeck.toggleClass("is-grid-mode", isGridView);
      projectGridWrap.toggleClass("projectGridCollapsed", !isGridView);
      projectEvidenceIndex.toggleClass("is-hidden", isGridView);
      projectViewButtons
        .removeClass("active")
        .attr("aria-pressed", "false")
        .filter("[data-project-view='" + view + "']")
        .addClass("active")
        .attr("aria-pressed", "true");
    }

    projectViewButtons.on("click", function () {
      setProjectView($(this).data("project-view"));
    });

    setProjectView("deck");

    window.updateProjectDeckFilter("all");
  }

  // Typing Animation
  const phrases = [
    "Quantitative Developer & AI Data Systems Engineer",
    "Building Agentic Analytics Systems",
    "Engineering Privacy-Safe Data Workflows",
    "Developing Fixed Income and Trading Tooling",
    "Turning Complex Datasets into Decision Systems",
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseTime = 2000;

  function typeText() {
    const currentPhrase = phrases[phraseIndex];
    const typedTextElement = document.querySelector(".typed-text");

    if (!typedTextElement) return;

    if (isDeleting) {
      typedTextElement.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typedTextElement.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    let typeSpeed = isDeleting ? deletingSpeed : typingSpeed;

    if (!isDeleting && charIndex === currentPhrase.length) {
      typeSpeed = pauseTime;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 500;
    }

    setTimeout(typeText, typeSpeed);
  }

  // Start typing animation after the loading screen begins to clear.
  setTimeout(typeText, prefersReducedMotion ? 0 : 900);

  // Scroll Progress Bar
  $(window).on("scroll", function () {
    const scrollTop = $(window).scrollTop();
    const docHeight = $(document).height();
    const winHeight = $(window).height();
    const scrollPercent = (scrollTop / Math.max(docHeight - winHeight, 1)) * 100;
    $("#scrollProgress").css("width", scrollPercent + "%");
  });

  // Back to Top Button
  const backToTopBtn = $("#backToTop");

  $(window).on("scroll", function () {
    if ($(window).scrollTop() > 300) {
      backToTopBtn.addClass("visible");
    } else {
      backToTopBtn.removeClass("visible");
    }
  });

  backToTopBtn.on("click", function () {
    if (prefersReducedMotion) {
      window.scrollTo(0, 0);
      return;
    }

    $("html, body").animate(
      {
        scrollTop: 0,
      },
      800
    );
  });

  // Parallax Effect on Header
  $(window).on("scroll", function () {
    if (prefersReducedMotion) return;
    const scrolled = $(window).scrollTop();
    $("#headerImage").css("transform", "translateY(" + scrolled * 0.5 + "px)");
  });

  // Smooth scroll to sections
  $("#navigation .nav-link[href^='#']").click(function (e) {
    e.preventDefault();

    var targetElement = $(this).attr("href");
    scrollToTarget(targetElement);

    // Close mobile menu after click
    $(".navbar-collapse").collapse("hide");
  });

  // Sticky navigation
  const nav = $("#navigation");

  $(window).on("scroll", stickyNavigation);

  function stickyNavigation() {
    $("body").toggleClass("fixedNav", $(window).scrollTop() > 4);
  }

  stickyNavigation();

  // Add smooth reveal on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          if (entry.target.classList.contains("resumeSubsection")) {
            entry.target.classList.add("animate-in");
          }
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  // Observe all resume subsections for fade-in effect
  document.querySelectorAll(".resumeSubsection, .filterItem, .bookCarousel").forEach((el) => {
    observer.observe(el);
  });

  // Add number counting animation
  function animateNumbers() {
    $(".number-counter").each(function () {
      const $this = $(this);
      const countTo = $this.attr("data-count");

      if (prefersReducedMotion) {
        $this.text(countTo);
        return;
      }

      $({ countNum: 0 }).animate(
        {
          countNum: countTo,
        },
        {
          duration: 2000,
          easing: "swing",
          step: function () {
            $this.text(Math.floor(this.countNum));
          },
          complete: function () {
            $this.text(this.countNum);
          },
        }
      );
    });
  }

  // Trigger number animation when in view
  const numberObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateNumbers();
          numberObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll(".number-counter").forEach((el) => {
    numberObserver.observe(el);
  });
});

filterSelection("all");

function filterSelection(c) {
  var requestedFilter = c;
  var x = document.getElementsByClassName("filterItem");
  var projectIndexRows = document.getElementsByClassName("projectIndexRow");
  if (c == "all") c = "";

  for (var i = 0; i < x.length; i++) {
    removeClass(x[i], "show");
    if (x[i].className.indexOf(c) > -1) addClass(x[i], "show");
  }

  for (var j = 0; j < projectIndexRows.length; j++) {
    removeClass(projectIndexRows[j], "projectIndexHidden");
    if (c && !projectIndexRows[j].classList.contains(c)) {
      addClass(projectIndexRows[j], "projectIndexHidden");
    }
  }

  if (typeof window.updateProjectDeckFilter === "function") {
    window.updateProjectDeckFilter(requestedFilter);
  }
}

// Show filtered elements
function addClass(element, name) {
  var i, arr1, arr2;
  arr1 = element.className.split(" ");
  arr2 = name.split(" ");
  for (i = 0; i < arr2.length; i++) {
    if (arr1.indexOf(arr2[i]) == -1) {
      element.className += " " + arr2[i];
    }
  }
}

// Hide elements that are not selected
function removeClass(element, name) {
  var i, arr1, arr2;
  arr1 = element.className.split(" ");
  arr2 = name.split(" ");
  for (i = 0; i < arr2.length; i++) {
    while (arr1.indexOf(arr2[i]) > -1) {
      arr1.splice(arr1.indexOf(arr2[i]), 1);
    }
  }
  element.className = arr1.join(" ");
}

// Add active class to the current control button (highlight it)
var btnContainer = document.getElementById("filter");
var buttons = btnContainer.getElementsByClassName("btn");

for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener("click", function () {
    var current = btnContainer.getElementsByClassName("active");
    if (current.length) {
      current[0].classList.remove("active");
    }
    this.classList.add("active");
  });
}
