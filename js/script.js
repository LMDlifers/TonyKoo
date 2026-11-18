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


  // Dark Mode Toggle
  const darkModeToggle = $("#darkModeToggle");
  const body = $("body");

  if (localStorage.getItem("darkMode") === "enabled") body.addClass("dark-mode");

  function syncThemeToggle() {
    const isDark = body.hasClass("dark-mode");
    darkModeToggle.attr("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    // Font Awesome swaps <i> for <svg>, so re-insert an <i> and let its observer redraw the icon.
    darkModeToggle.html(`<i class="fas fa-${isDark ? "sun" : "moon"}" aria-hidden="true"></i>`);
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
  document.querySelectorAll(".resumeSubsection, .testimonialCard, .bookCarousel, .writingCard, .certCard").forEach((el) => {
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

// A link to a collapsed section (#reading, #certifications) opens it, even when the hash is already set.
function openHashTarget(hash) {
  var target = hash && document.getElementById(hash.slice(1));
  if (target && target.tagName === "DETAILS") { target.open = true; target.scrollIntoView(); }
}
window.addEventListener("hashchange", function () { openHashTarget(location.hash); });
document.addEventListener("click", function (e) {
  var link = e.target.closest && e.target.closest('a[href^="#"]');
  if (link) openHashTarget(link.getAttribute("href"));
});
openHashTarget(location.hash);
