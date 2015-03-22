(function() {
  'use strict';
  var hasTouch = 'ontouchstart' in window;
  var elementDragged, elementDraggedParent, isTouchDragging;
  var container = document.querySelector('.container');
  var thumbsContainer = document.querySelector('.thumbnail-pane');
  var dropzones = document.querySelector('.drop-zone-pane');
  var audio = document.querySelector('audio');
  var video = document.querySelector('video');
  var overlay = document.querySelector('.video-overlay');
  var actionPane = document.querySelector('.action-pane');
  var successMsg = document.querySelector('.success-msg');
  var tryAgain = document.querySelector('.try-again button');
  var failText = document.querySelector('.try-again p');
  var tryAgainContainer = document.querySelector('div.try-again');
  var images = [
    'media/lemon_step_1_master.jpg',
    'media/lemon_step_2_master.jpg',
    'media/lemon_step_3_master.jpg',
    'media/lemon_step_4_master.jpg',
    'media/lemon_step_5_master.jpg'
  ];

  // Mimic the LMS API
  var LMS = {
    _currentScore: 0,

    setScore: function (score) {
      this._currentScore = score;
    },

    score: function () {
      return this._currentScore;
    }
  };

  /*
   * Polyfill for checking whether a string contains a substring, taken from:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
   */
  if (!String.prototype.includes) {
    String.prototype.includes = function() {
      return String.prototype.indexOf.apply(this, arguments) !== -1;
    };
  }

  /*
   * Knuth shuffle method, taken from:
   * http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
   */
  var shuffle = function (array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  };

  // Shuffle the images and add to the DOM each time
  var setImages = function () {
    images = shuffle(images);
    images.forEach(function (image) {
      var img = document.createElement('img');
      var thumbnail = document.createElement('div');
      img.src = image;
      thumbnail.classList.add('thumbnail');
      thumbnail.appendChild(img);
      thumbsContainer.appendChild(thumbnail);
    });
  };

  // Check the results to see if they passed
  var checkResults = function () {
    var dropzoneImages = document.querySelectorAll('.drop-zone img');
    var total = images.length;

    // Check to see if all images have been dragged over
    if (total > 0 && dropzoneImages.length === total) {
      var numCorrect = 0;
      for (var i = 0; i < total; i++) {
        if (dropzoneImages[i].src.includes(i + 1)) {
          dropzoneImages[i].parentNode.classList.add('correct');
          numCorrect++;
        } else {
          dropzoneImages[i].parentNode.classList.add('incorrect');
        }
      }

      // Set the score on a 0-100 scale
      LMS.setScore((numCorrect / total) * 100);

      if (LMS.score() > 80) {
        dropzones.classList.add('dim');
        successMsg.classList.remove('hidden');
        overlay.classList.add('closed');
        audio.play();
        video.play();
        video.setAttribute('controls', 'controls');
      } else {
        failText.innerHTML = 'Looks like you got ' + LMS.score() + '% correct. Let\'s see if you can do better...';
        tryAgainContainer.classList.remove('hidden');
      }

      actionPane.classList.toggle('active');
    }
  };

  var addNonTouchEvents = function () {
    // On hover, switch to GIF thumbnail
    container.addEventListener('mouseover', function (e) {
      var img = e.target;
      if (img && img.nodeName === 'IMG') {
        img.src = img.src.slice(0, -3).concat('gif');
        img.parentNode.classList.add('magnify');
      }
    });

    // Go back to JPG after hover
    container.addEventListener('mouseout', function (e) {
      var img = e.target;
      if (img && img.nodeName === 'IMG') {
        img.src = img.src.slice(0, -3).concat('jpg');
        img.parentNode.classList.remove('magnify');
      }
    });

    // When drag begins, switch back to the JPG
    container.addEventListener('dragstart', function (e) {
      var img = e.target;
      if (img && img.nodeName === 'IMG') {
        img.src = img.src.slice(0, -3).concat('jpg');
        e.dataTransfer.effectAllowed = 'move';
        elementDragged = img;
        elementDraggedParent = img.parentNode;
      }
    });

    // Clear out the elementDragged variable when drag ends
    container.addEventListener('dragend', function () {
      elementDraggedParent.classList.remove('magnify');
      elementDragged = null;
      elementDraggedParent = null;
    });

    /*
     * Need to listen for this event so that our DataTransfer object
     * remains active, and we'll be able to drop successfully when
     * the user releases
     */
    dropzones.addEventListener('dragover', function (e) {
      var dropzone = e.target;
      if (dropzone && dropzone.classList.contains('drop-zone')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }
      return false;
    });

    /*
     * When we enter the drop zone, add class to the drop zone to
     * indicate it's ready to accept the drop
     */
    dropzones.addEventListener('dragenter', function (e) {
      var dropzone = e.target;
      if (dropzone && dropzone.classList.contains('drop-zone')) {
        dropzone.classList.add('over');
      }
    });

    /*
     * When we leave the drop zone, remove the class
     */
    dropzones.addEventListener('dragleave', function (e) {
      var dropzone = e.target;
      if (dropzone && dropzone.classList.contains('drop-zone')) {
        dropzone.classList.remove('over');
      }
    });

    /*
     * On drop, add the image to the dropzone and check to see if we're done
     */
    dropzones.addEventListener('drop', function (e) {
      var dropzone = e.target;
      if (dropzone && dropzone.classList.contains('drop-zone')) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.appendChild(elementDragged);
        dropzone.classList.remove('over');
        checkResults();
      }
      return false;
    });

    /*
     * When the "Try Again" button is clicked, reset everything
     */
    tryAgain.addEventListener('click', function () {
      var drops = document.querySelectorAll('.drop-zone');
      for (var i = 0; i < drops.length; i++) {
        drops[i].innerHTML = '';
        drops[i].classList.remove('correct', 'incorrect');
      }
      thumbsContainer.innerHTML = '';
      this.parentNode.classList.add('hidden');
      actionPane.classList.toggle('active');
      setImages();
    });
  };

  /*
   * Touch events aren't entirely fleshed out. If I had more time, I'd add them
   * and also make the layout more responsive to accommodate mobile devices.
   */
  var addTouchEvents = function () {
    // When drag begins, switch back to the JPG
    container.addEventListener('touchstart', function (e) {
      var img = e.target;
      if (img && img.nodeName === 'IMG') {
        e.preventDefault();
        img.src = img.src.slice(0, -3).concat('gif');
        img.parentNode.classList.add('magnify');
        elementDragged = img;
        elementDraggedParent = img.parentNode;
        isTouchDragging = true;
      }
    });

    // When drag begins, switch back to the JPG
    container.addEventListener('touchend', function (e) {
      if (isTouchDragging) {
        e.preventDefault();
        var changedTouch = event.changedTouches[0];
        var elem = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
        if (elem.classList.contains('drop-zone')) {
          executeTouchDrop();
        }
        elementDragged = null;
        elementDraggedParent = null;
        isTouchDragging = false;
      }
    });

    // When drag begins, switch back to the JPG
    container.addEventListener('touchmove', function (e) {
      var img = e.target;
      if (isTouchDragging) {
        e.preventDefault();
        img.src = img.src.slice(0, -3).concat('jpg');
        elementDragged = img;
        elementDraggedParent = img.parentNode;
      }
    });

    var executeTouchDrop = function () {
      window.alert('Dropped in a drop zone');
    };

  };

  if (hasTouch) {
    addTouchEvents();
  } else {
    addNonTouchEvents();
  }

  // On initial load, shuffle the images
  setImages();

})();