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

  $(".filterItemImg").attr("loading", "lazy").attr("decoding", "async");

  // Dark Mode Toggle
  const darkModeToggle = $("#darkModeToggle");
  const body = $("body");

  if (localStorage.getItem("darkMode") === "disabled") body.removeClass("dark-mode");

  function syncThemeToggle() {
    const isDark = body.hasClass("dark-mode");
    darkModeToggle.attr("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    darkModeToggle.find("i")
      .toggleClass("fa-moon", !isDark)
      .toggleClass("fa-sun", isDark);
  }

  syncThemeToggle();

  darkModeToggle.on("click", function () {
    body.toggleClass("dark-mode");

    if (body.hasClass("dark-mode")) {
      localStorage.setItem("darkMode", "enabled");
    } else {
      localStorage.setItem("darkMode", "disabled");
    }

    syncThemeToggle();
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
    const projectDeckEvaluation = $("#projectDeckEvaluation");
    const projectDeckLimitations = $("#projectDeckLimitations");
    const projectDeckTech = $("#projectDeckTech");
    const projectDeckLink = $("#projectDeckLink");
    const projectDeckCounter = $("#projectDeckCounter");
    const projectDeckRail = $("#projectDeckRail");
    const projectGridWrap = $("#projectGridWrap");
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

    const reviewerNotesByTitle = {
      "Agentic Healthcare Analytics Chatbot": {
        evaluation: "Check generated SQL validity, chart usefulness, reviewer override rate, hallucinated column rate, and safe refusal behavior.",
        limitations: "Sanitized portfolio version only. It excludes private data and does not claim clinical deployment or patient-facing decision support.",
      },
      "Judicial Analytics: Legal NLP": {
        evaluation: "Use temporal splits, leakage audits, baseline comparisons, per-class error review, and case-level calibration checks.",
        limitations: "Public report describes method and evaluation design. It does not publish raw judgments, private metadata, or legal advice claims.",
      },
      "Self-RL & RAG Extraction Pipelines": {
        evaluation: "Measure extraction accuracy, cache hit rate, latency, token spend, retry frequency, and human correction categories.",
        limitations: "Resume-backed summary only. Proprietary documents, prompts, internal screenshots, and production credentials stay excluded.",
      },
      "IBKR Algorithmic Trading Bot": {
        evaluation: "Backtest with transaction costs, walk-forward validation, paper-trading logs, drawdown limits, and order-state failure cases.",
        limitations: "Prototype and repository evidence only. No live PnL, investment advice, or broker-side reliability guarantee is claimed.",
      },
      "RentLock: Smart Contract Escrow dApp": {
        evaluation: "Review escrow state transitions, dispute paths, verifier assumptions, reentrancy risks, and frontend-wallet failure states.",
        limitations: "Design note and prototype framing only. No audited contract, legal enforceability claim, or production custody claim is implied.",
      },
      "Smoodee - Sustainable Food Tech Startup": {
        evaluation: "Assess customer acquisition, supply planning, margin assumptions, fulfillment reliability, and repeat-order signals.",
        limitations: "Business and product summary only. Vendor details, financials, and private operating data are not published.",
      },
      "Loan Default Analytics Pipeline": {
        evaluation: "Compare baseline models, check calibration, threshold trade-offs, explainability outputs, and segment-level error patterns.",
        limitations: "Portfolio case note only. It omits private records and does not claim production credit-decision deployment.",
      },
      "FairTracker: Event Management & Analytics Platform": {
        evaluation: "Test event search, geospatial filtering, authentication flows, data integrity, and dashboard usefulness under realistic usage.",
        limitations: "Public summary only. It does not expose user data, API keys, or production traffic metrics.",
      },
      "WelfareHome: Social Impact Web Platform": {
        evaluation: "Review booking flow completion, role permissions, caregiver handoff clarity, and data-update auditability.",
        limitations: "Public-safe project framing only. Sensitive beneficiary data and operational records are excluded.",
      },
      "Fixed Income Analytics: Yield Curve Modeling": {
        evaluation: "Validate pricing math against simple baselines, stress curve shifts, duration and convexity outputs, and scenario reproducibility.",
        limitations: "Educational quant tooling only. It does not make trading recommendations or claim live-market execution.",
      },
      "Black-Scholes Options Analytics Dashboard": {
        evaluation: "Check pricing against analytical baselines, Greek sensitivities, payoff scenarios, and parameter edge cases.",
        limitations: "Learning and dashboard project only. It does not claim market calibration, volatility forecasting, or trading performance.",
      },
    };

    function fallbackReviewerNotes(project) {
      if (project.categories.indexOf("quant") > -1) {
        return {
          evaluation: "Validate formulas, compare against simple baselines, stress key assumptions, and document failure cases.",
          limitations: "Public project summary only. No trading performance, investment advice, or production execution claim is implied.",
        };
      }

      if (project.categories.indexOf("ai") > -1) {
        return {
          evaluation: "Track output quality, latency, cost, reviewer overrides, and failure categories against non-LLM baselines.",
          limitations: "Public summary omits private data. Production use would need monitoring, access control, and drift checks.",
        };
      }

      return {
        evaluation: "Check workflow completion, data quality, user-facing reliability, and the assumptions behind each metric.",
        limitations: "Public-safe summary only. Private datasets, credentials, client identifiers, and unsupported deployment claims are excluded.",
      };
    }

    function getReviewerNotes(project) {
      return reviewerNotesByTitle[project.title] || fallbackReviewerNotes(project);
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
      const reviewerNotes = getReviewerNotes(project);
      projectDeckEvaluation.text(reviewerNotes.evaluation);
      projectDeckLimitations.text(reviewerNotes.limitations);
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

  // Scroll Progress Bar
  $(window).on("scroll", function () {
    const scrollTop = $(window).scrollTop();
    const docHeight = $(document).height();
    const winHeight = $(window).height();
    const scrollPercent = (scrollTop / Math.max(docHeight - winHeight, 1)) * 100;
    $("#scrollProgress").css("width", scrollPercent + "%");
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
  document.querySelectorAll(".proofCard, .resumeSubsection, .filterItem, .projectDeck, .testimonialCard, .bookCarousel, .writingCard, .certCard").forEach((el) => {
    el.classList.add("motion-reveal");
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
  if (c == "all") c = "";

  for (var i = 0; i < x.length; i++) {
    removeClass(x[i], "show");
    if (x[i].className.indexOf(c) > -1) addClass(x[i], "show");
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
