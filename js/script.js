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
  const minimumLoadingTime = prefersReducedMotion ? 0 : 350;

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
  setTimeout(hideLoadingScreen, prefersReducedMotion ? 100 : 900);

  // Dark Mode Toggle
  const darkModeToggle = $("#darkModeToggle");
  const body = $("body");

  if (localStorage.getItem("darkMode") === "enabled") {
    body.addClass("dark-mode");
  }

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

  // Command palette
  const commandPalette = $("#commandPalette");
  const commandPaletteInput = $("#commandPaletteInput");
  const commandPaletteResults = $("#commandPaletteResults");
  const commandPaletteTrigger = $("#commandPaletteTrigger");
  const commandCloseControls = $("[data-command-close]");
  let activeCommandIndex = 0;

  const commands = [
    {
      title: "Open Proof Snapshot",
      meta: "Role target, strongest metrics, resume, and contact",
      icon: "fa-bolt",
      href: "#proof",
      key: "proof recruiter scan metrics evidence",
    },
    {
      title: "Open Project Lab",
      meta: "Browse AI, quant, data, and app projects",
      icon: "fa-layer-group",
      href: "#portfolio",
      key: "projects",
    },
    {
      title: "Visual Evidence Gallery",
      meta: "Diagrams, demos, research cards, and field notes",
      icon: "fa-photo-video",
      href: "#evidence",
      key: "evidence visuals diagrams demos videos research",
    },
    {
      title: "How I Designed an Agentic Healthcare Analytics Workflow",
      meta: "Agentic SQL, auditability, and human review",
      icon: "fa-notes-medical",
      href: "reports/agentic-healthcare-analytics.html",
      key: "healthcare ai agentic sql report",
    },
    {
      title: "Leakage-Aware Evaluation in Legal NLP",
      meta: "Legal NLP, leakage control, and evaluation",
      icon: "fa-balance-scale",
      href: "reports/judicial-analytics-legal-nlp.html",
      key: "legal nlp judicial bert evaluation",
    },
    {
      title: "Using FAISS Caching to Reduce LLM Cost and Latency",
      meta: "Semantic cache design, thresholds, and fallback behavior",
      icon: "fa-database",
      href: "reports/faiss-caching-llm-cost-latency.html",
      key: "faiss rag llm cache cost latency retrieval",
    },
    {
      title: "Designing Human-in-the-Loop AI Systems for Sensitive Data",
      meta: "Review queues, audit trails, guardrails, and escalation",
      icon: "fa-user-check",
      href: "reports/human-in-the-loop-ai-sensitive-data.html",
      key: "human in the loop hitl sensitive data privacy guardrails",
    },
    {
      title: "From Yield Curves to Trading Tooling",
      meta: "Quant engineering notes on pricing, risk, and deployment",
      icon: "fa-chart-line",
      href: "reports/yield-curve-quant-engineering-notes.html",
      key: "yield curve trading tooling quant engineering fixed income",
    },
    {
      title: "Telepresence Market Adoption Strategy",
      meta: "Market sizing, Bass diffusion, and scenario analysis",
      icon: "fa-chart-line",
      href: "reports/telepresence-adoption-strategy.html",
      key: "telepresence market adoption bass diffusion strategy",
    },
    {
      title: "RentLock Escrow dApp",
      meta: "Smart contracts, escrow states, and dispute logic",
      icon: "fa-lock",
      href: "reports/rentlock-escrow-dapp.html",
      key: "web3 escrow smart contract rentlock",
    },
    {
      title: "Loan Default Analytics",
      meta: "Credit risk, PySpark, model comparison",
      icon: "fa-chart-pie",
      href: "reports/loan-default-analytics.html",
      key: "credit risk loan default analytics",
    },
    {
      title: "Technical Writing",
      meta: "Thumbnail-backed reports, case studies, and research notes",
      icon: "fa-file-alt",
      href: "#writing",
      key: "writing reports case studies research notes articles",
    },
    {
      title: "Resume Timeline",
      meta: "Featured roles, earlier experience, education, and skills",
      icon: "fa-briefcase",
      href: "#resume",
      key: "experience resume timeline tradition skezi nus temasek military middle office",
    },
    {
      title: "Testimonials",
      meta: "Quick credibility notes and references",
      icon: "fa-comment-dots",
      href: "#testimonials",
      key: "testimonials references credibility",
    },
    {
      title: "Reading and Research Diet",
      meta: "Technical books, papers, and thinking sources",
      icon: "fa-book-open",
      href: "#reading",
      key: "reading research diet papers books",
    },
    {
      title: "Download Resume",
      meta: "Open Tony Koo Ye Long PDF resume",
      icon: "fa-download",
      href: "./files/Resume_TonyKooYeLong.pdf",
      key: "resume cv pdf",
      external: true,
    },
    {
      title: "Contact",
      meta: "Email and GitHub links",
      icon: "fa-envelope",
      href: "#contact",
      key: "contact email github",
    },
  ];

  function filteredCommands() {
    const query = commandPaletteInput.val().trim().toLowerCase();

    if (!query) return commands;

    return commands.filter(function (command) {
      return [command.title, command.meta, command.key].join(" ").toLowerCase().includes(query);
    });
  }

  function renderCommands() {
    const items = filteredCommands();
    activeCommandIndex = Math.min(activeCommandIndex, Math.max(items.length - 1, 0));
    commandPaletteResults.empty();

    if (!items.length) {
      commandPaletteResults.html('<div class="no-results">No command found</div>');
      return;
    }

    items.forEach(function (command, index) {
      const button = $("<button>", {
        type: "button",
        class: "commandItem" + (index === activeCommandIndex ? " is-active" : ""),
        "data-command-index": index,
        role: "option",
        "aria-selected": index === activeCommandIndex ? "true" : "false",
      });

      button.append(
        $("<span>", { class: "commandItemIcon" }).append(
          $("<i>", { class: "fas " + command.icon, "aria-hidden": "true" })
        ),
        $("<span>").append(
          $("<span>", { class: "commandItemTitle", text: command.title }),
          $("<span>", { class: "commandItemMeta", text: command.meta })
        ),
        $("<span>", { class: "commandItemKey", text: command.href.charAt(0) === "#" ? "Jump" : "Open" })
      );

      button.on("mouseenter", function () {
        activeCommandIndex = index;
        renderCommands();
      });

      button.on("click", function () {
        runCommand(command);
      });

      commandPaletteResults.append(button);
    });
  }

  function openCommandPalette() {
    commandPalette.addClass("is-open").attr("aria-hidden", "false");
    $("body").addClass("command-open");
    activeCommandIndex = 0;
    commandPaletteInput.val("");
    renderCommands();
    setTimeout(function () {
      commandPaletteInput.trigger("focus");
    }, 30);
  }

  function closeCommandPalette() {
    commandPalette.removeClass("is-open").attr("aria-hidden", "true");
    $("body").removeClass("command-open");
  }

  function runCommand(command) {
    closeCommandPalette();

    if (command.href.charAt(0) === "#") {
      scrollToTarget(command.href, prefersReducedMotion ? 0 : 300);
      return;
    }

    if (command.external) {
      window.open(command.href, "_blank", "noopener");
      return;
    }

    window.location.href = command.href;
  }

  commandPaletteTrigger.on("click", openCommandPalette);
  commandCloseControls.on("click", closeCommandPalette);
  commandPaletteInput.on("input", function () {
    activeCommandIndex = 0;
    renderCommands();
  });

  $(document).on("keydown", function (e) {
    const isPaletteShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";

    if (isPaletteShortcut) {
      e.preventDefault();
      if (commandPalette.hasClass("is-open")) {
        closeCommandPalette();
      } else {
        openCommandPalette();
      }
      return;
    }

    if (!commandPalette.hasClass("is-open")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeCommandPalette();
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeCommandIndex = (activeCommandIndex + 1) % Math.max(filteredCommands().length, 1);
      renderCommands();
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const itemCount = Math.max(filteredCommands().length, 1);
      activeCommandIndex = (activeCommandIndex - 1 + itemCount) % itemCount;
      renderCommands();
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const command = filteredCommands()[activeCommandIndex];
      if (command) runCommand(command);
    }
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
    "Quant developer + AI data systems engineer",
    "Agentic analytics with audit trails",
    "Privacy-safe data workflows",
    "Fixed income and trading tooling",
    "Complex data into decisions",
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
  document.querySelectorAll(".proofCard, .resumeSubsection, .filterItem, .projectDeck, .projectEvidenceIndex, .testimonialCard, .bookCarousel, .writingCard, .certCard").forEach((el) => {
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
