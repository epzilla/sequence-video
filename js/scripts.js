(function() {
  'use strict';

  var elementDragged;
  var thumbsContainer = document.querySelector('.thumbnail-pane');
  var dropzones = document.querySelector('.drop-zone-pane');
  var video = document.querySelector('video');
  var successMsg = document.querySelector('.success-msg');
  var tryAgain = document.querySelector('.try-again');
  var images = [
    'media/lemon_step_1_master.jpg',
    'media/lemon_step_2_master.jpg',
    'media/lemon_step_3_master.jpg',
    'media/lemon_step_4_master.jpg',
    'media/lemon_step_5_master.jpg'
  ];

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

  var checkResults = function () {
    var dropzoneImages = document.querySelectorAll('.drop-zone img');
    // Check to see if all images have been dragged over
    if (dropzoneImages.length === images.length) {
      for (var i = 0; i < dropzoneImages.length; i++) {
        if (dropzoneImages[i].src.includes(i + 1)) {
          dropzoneImages[i].parentNode.classList.add('correct');
        } else {
          dropzoneImages[i].parentNode.classList.add('incorrect');
        }
      }

      if (document.querySelectorAll('.correct').length === images.length) {
        dropzones.classList.add('dim');
        successMsg.classList.remove('hidden');
        video.play();
        video.setAttribute('controls', 'controls');
      } else {
        tryAgain.classList.remove('hidden');
      }
    }
  };

  // On hover, switch to GIF thumbnail
  thumbsContainer.addEventListener('mouseover', function (e) {
    if (e.target && e.target.nodeName === 'IMG') {
      var newSrc = e.target.src.slice(0, -3).concat('gif');
      e.target.src = newSrc;
    }
  });

  // Go back to JPG after hover
  thumbsContainer.addEventListener('mouseout', function (e) {
    if (e.target && e.target.nodeName === 'IMG') {
      var newSrc = e.target.src.slice(0, -3).concat('jpg');
      e.target.src = newSrc;
    }
  });

  // When drag begins, switch back to the JPG
  thumbsContainer.addEventListener('dragstart', function (e) {
    var img = e.target;
    if (img && img.nodeName === 'IMG') {
      var newSrc = img.src.slice(0, -3).concat('jpg');
      img.src = newSrc;
      e.dataTransfer.effectAllowed = 'move';
      elementDragged = img;
    }
  });

  // Clear out the elementDragged variable when drag ends
  thumbsContainer.addEventListener('dragend', function () {
    elementDragged = null;
  });

  /*
   * Need to listen for this event so that our DataTransfer object
   * remains active, and we'll be able to drop successfully when
   * the user releases
   */
  dropzones.addEventListener('dragover', function (e) {
    if (e.target && e.target.classList.contains('drop-zone')) {
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
    if (e.target && e.target.classList.contains('drop-zone')) {
      e.target.classList.add('over');
    }
  });

  /*
   * When we leave the drop zone, remove the class
   */
  dropzones.addEventListener('dragleave', function (e) {
    if (e.target && e.target.classList.contains('drop-zone')) {
      e.target.classList.remove('over');
    }
  });

  /*
   * On drop, add the image to the dropzone and check to see if we're done
   */
  dropzones.addEventListener('drop', function (e) {
    if (e.target && e.target.classList.contains('drop-zone')) {
      e.preventDefault();
      e.stopPropagation();
      e.target.appendChild(elementDragged);
      e.target.classList.remove('over');
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
    this.classList.add('hidden');
    setImages();
  });

  // On initial load, shuffle the images
  setImages();

})();