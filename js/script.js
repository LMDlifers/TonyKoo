$(document).ready(function () {
  // Loading Screen
  setTimeout(function () {
    $("#loadingScreen").addClass("hidden");
  }, 1500);

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
      const targetPosition = $("#" + section).offset().top;
      const navHeight = $("#navigation").outerHeight();

      $("html, body").animate(
        {
          scrollTop: targetPosition - navHeight - 20,
        },
        800
      );

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

    $("section[id]").each(function () {
      const section = $(this);
      const sectionTop = section.offset().top;
      const sectionBottom = sectionTop + section.outerHeight();
      const sectionId = section.attr("id");

      if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
        $(".sidebar-link").removeClass("active-section");
        $(`.sidebar-link[data-section="${sectionId}"]`).addClass(
          "active-section"
        );
      }
    });
  });

  // Sidebar link clicks
  $(".sidebar-link").on("click", function (e) {
    e.preventDefault();
    const target = $(this).attr("href");
    const targetPosition = $(target).offset().top;
    const navHeight = $("#navigation").outerHeight();

    $("html, body").animate(
      {
        scrollTop: targetPosition - navHeight - 20,
      },
      800
    );

    sidebar.removeClass("active");
  });

  // Typing Animation
  const phrases = [
    "Engineering Self-Reflective RL for Finance",
    "Optimizing High-Frequency Data Pipelines",
    "Architecting Low-Latency Algorithmic Systems",
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

  // Start typing animation after loading screen
  setTimeout(typeText, 2000);

  // Scroll Progress Bar
  $(window).on("scroll", function () {
    const scrollTop = $(window).scrollTop();
    const docHeight = $(document).height();
    const winHeight = $(window).height();
    const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
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
    $("html, body").animate(
      {
        scrollTop: 0,
      },
      800
    );
  });

  // Parallax Effect on Header
  $(window).on("scroll", function () {
    const scrolled = $(window).scrollTop();
    $("#headerImage").css("transform", "translateY(" + scrolled * 0.5 + "px)");
  });

  // 3D Tilt Effect for Portfolio Cards
  $(".filterItem").on("mousemove", function (e) {
    const card = $(this);
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.css({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    });
  });

  $(".filterItem").on("mouseleave", function () {
    $(this).css({
      transform: "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)",
    });
  });

  // Smooth scroll to sections
  $("#navigation li a").click(function (e) {
    e.preventDefault();

    var targetElement = $(this).attr("href");
    var targetPosition = $(targetElement).offset().top;
    var navHeight = $("#navigation").outerHeight();

    $("html, body").animate(
      {
        scrollTop: targetPosition - navHeight - 20,
      },
      800
    );

    // Close mobile menu after click
    $(".navbar-collapse").collapse("hide");
  });

  // Sticky navigation
  const nav = $("#navigation");
  const navTop = nav.offset().top;

  $(window).on("scroll", stickyNavigation);

  function stickyNavigation() {
    const body = $("body");
    if ($(window).scrollTop() >= navTop) {
      body.css("padding-top", nav.outerHeight() + "px");
      body.addClass("fixedNav");
    } else {
      body.css("padding-top", 0);
      body.removeClass("fixedNav");
    }
  }

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
  document.querySelectorAll(".resumeSubsection, .filterItem").forEach((el) => {
    observer.observe(el);
  });

  // Add number counting animation
  function animateNumbers() {
    $(".number-counter").each(function () {
      const $this = $(this);
      const countTo = $this.attr("data-count");

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
  var x = document.getElementsByClassName("filterItem");
  if (c == "all") c = "";

  for (var i = 0; i < x.length; i++) {
    removeClass(x[i], "show");
    if (x[i].className.indexOf(c) > -1) addClass(x[i], "show");
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
    var current = document.getElementsByClassName("active");
    current[0].className = "btn";
    this.className = "btn active";
  });
}
