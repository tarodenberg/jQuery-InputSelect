/**
 * inputselect jQuery Plugin
 *
 * Requires jQuery 1.4.2
 *
 * Copyright 2011 Tom Rodenberg
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 */
(function() {

  var tag = 'inputselect';

  $.fn.inputselect = function(opts) {
    // Check that the element exists
    if(this.length == 0){
      return this;
    }

    $.each(this, function(item) {
      // default options
      var itemOpts = $.extend({
        readonly: false,
        className: null,
        name: null,
        autocomplete: true,
        listWidth: 0,
        listMinWidth: 0
      }, opts);

      $.inputselect.initSelect(this, itemOpts);

    });

    // Should return the select control used to invoke this function
    return this;
  }

  // counter used to create unique names for input controls
  var selectCount = 0;

  /**
   * Replace the stay location select box
   *
   * @param select jQuery / DOMElement Select control
   * @param opts {}
   */
  $.inputselect = {

    updateFromSelect: function(select) {
      select = $(select);

      var data = select.data(tag);
      if(data && data.input && data.list) {
        // Get value of select control
        var selectVal = select.val();

        // Loop through possible values
        $('li', data.list).each(function() {
          var itemData = $(this).data();
          if(itemData && itemData.value == selectVal) {
            data.input.val(itemData.text);
            return false;
          }
        });
      }
    },

    initSelect: function(select, opts) {
      // Ensure jQuery object and hide element
      select = opts.select = $(select);

      // Get width of original control
      var selectWidth = select.width() + 6;

      // Keep track of which input method was most recently used
      var lastpress = '';

      // Hide original control
      //select.hide();
      select.css('visibility', 'hidden');

      var data = select.data(tag);

      // check if initialize has occured
      if(!data) {

        // attach options as data tag
        select.data(tag, opts);

        // check for anonymous control
        // attempt to assign a unique name
        if(!opts.name || opts.name == '') {
          opts.name = tag + '-' +
            (select.attr('name') ?
              select.attr('name') :
              selectCount++);
        }

        // create a container for our widget
        var container = opts.container = $('<div></div>')
          .addClass(tag + '-container')
          .width(selectWidth)
          .insertBefore(select);

        // create suggestion control if autocompete is enabled
        var suggest = opts.suggest = $('<input type="text" />')
          .attr({
            readonly: 'readonly',
            autocomplete: 'off',
            tabindex: -1
          })
          .addClass(tag + '-suggest')
          .addClass(tag + '-suggest-' + opts.name);
          
        //if(opts.autocomplete) {
          suggest.appendTo(container).hide();
        //}

        // create replacement input control
        var input = opts.input = $('<input type="text" />')
          .attr({
              name: opts.name,
              //readonly: 'readonly',
              tabindex: select.attr('tabindex'),
              autocomplete: 'off'
            })
          .addClass(tag + '-label')
          .addClass(tag + '-label-' + opts.name)
          .width(selectWidth - 24)
          .appendTo(container);

        if(opts.readonly) {
          input.attr('readonly', 'readonly');
        }

        // Used to check if browser retained the value of this control
        var inputVal = input.val();

        // Create unique button and list dom elements
        var button = opts.button = $('<a>&nbsp;</a>')
          //.insertBefore(select)
          .addClass(tag + '-button')
          .appendTo(container);

        // Create dropdown list
        var list = opts.list = $('<ul></ul>')
          .addClass(tag + '-list')
          .appendTo('body');

        // Adjusts position of dropdown control
        // to be under the input control
        var setListOffset = function () {
          var inputOffset = input.offset();

          list.css({
            top: inputOffset.top + 19,
            left: inputOffset.left
          });

          if(opts.listWidth > 0) {
            list.width(opts.listWidth);
          }
          else {
            var matchWidth = input.width() + 5 + button.width();

            list.width(opts.listMinWidth > matchWidth ?
              opts.listMinWidth : matchWidth);
          }
          $('ul.inputselect-list').hide();
          suggest.width(input.width()).show();
        }

        // Reposition dropdown if browser is resized
        $(window).resize(setListOffset);
        setListOffset();

        var selectVal = select.val();

        /**
         * Initialize option list
         */
        opts.options = $('option', select).each(function() {
          var x = $(this);
          if(x.val() == '') {
            return;
          }

          var item = $('<li>' + x.text() + '</li>').appendTo(list);
          item.data({
            value: x.val(),
            text: x.text(),
            item: item
          })
          .attr('class', x.attr('class'));

          if(x.val() == selectVal) {
            input.val(x.text());
          }

          if(inputVal == x.text()) {
            select.val(x.val());
            select.change();
          }
        });

        /**
         * Select dropdown list hover indicator
         */
        $('li', list).hover(function() {
          lastpress = 'mouse';
          $('li', list).removeClass('hover');
          $(this).addClass('hover');
        },
        function() {
          $(this).removeClass('hover');
        });

        // Flag used to track visiblity of dropdown
        /* @var listVisible Boolean */
        var listVisible = false;

        /**
         * Toggles visibility of the dropdown list
         */
        var toggleList = function(x) {
          if(x != null) {
            listVisible = x;
          }
          else {
            listVisible = !listVisible;
          }
          if(listVisible) {
            setListOffset();
          }
          list.toggle(listVisible);
        }

        /**
         * Input button toggles dropdown list
         */
        $(button).click(function() {
          toggleList();
          return false;
        });

        /**
         * Focus input control if focus is called on select control
         */
        $(select).focus(function() {
          $(input).focus();
        })

//        $(input).focus(function() {
//          $(select).focus();
//        })

        /**
         * Scrolls list to an item
         */
        var scrollListTo = function(item) {
          $('li', list).removeClass('hover');
          item.addClass('hover');
          
          // Show list if hidden
          toggleList(true);

          var listTop = list.scrollTop();
          var listBottom = listTop + list.height();

          // determine if desired item is currently shown
          var itemIndex = item.index();
          var itemTop = item.height() * itemIndex;
          var itemBottom = itemTop + item.height();

          if(itemTop < listTop) {
            // scroll up
            list.scrollTop(itemTop);
          }
          else if(itemBottom > listBottom) {
            // scroll down
            list.scrollTop(itemBottom - list.height());
          }
        }

        /**
         * Show the dropdown list on control focus or click
         */
        $(input).focus(function() {
          toggleList(true);
          //return false; (defaults to select all text)
        })
        .click(function() {
          toggleList(true);
          return false;
        })

        /**
         * Handle keystrokes on the control
         */
        .keydown(function(e) {

          var keyCode = e.which;

          switch(keyCode) {
            case 13: //enter
              if(lastpress == 'arrow') {
                var current = $('li.hover', list);
                if(current && current.length > 0) {
                  current.click();
                }
              }
              else {
                setInputValues(currentSuggestion);
              }
              list.hide();
              return false;
            case 38: //up
              lastpress = 'arrow';
              var current = $('li.hover', list).removeClass('hover');
              if(current && current.length > 0) {
                var listItem = current.prev().addClass('hover');
                scrollListTo(listItem);
              }
              else {
                var item = $('li:last', list).addClass('hover');
                list.scrollTop(9999);
              }
              return false;
            case 40: //down
              lastpress = 'arrow';
              toggleList(true);
              var current = $('li.hover', list);
              if(current && current.length > 0) {
                current.removeClass('hover');
                var item = current.next().addClass('hover').focus();
                scrollListTo(item);
              }
              else {
                $('li:first', list).addClass('hover');
                list.scrollTop(0);
              }
              return false;
            case 27: //esc
              toggleList(false);
              break;
            case 9: // tab
              return true;
            case 8: // backspace
              //return true;
            default:
              lastpress = 'key';
              if(opts.autocomplete) {

                // backspace, delete, copy, paste
                var inputVal = input.val();

                var letter = String.fromCharCode(keyCode);
                var notLetter = true;
                if(letter && /[\d\w\s]/.test(letter) && letter != "\t") {
                  inputVal += letter;
                  notLetter = false;
                }

                if(inputVal && inputVal != '') {
                  if(inputVal == input.val()) {
                    return notLetter;
                  }

                  var setText = function(data) {
                    currentSuggestion = data;
                    scrollListTo(data.item);
                    suggest.val(data.text);
                    // fix case
                    input.val(data.text.substr(0, inputVal.length));
                  }

                  // Get list of matching options
                  var result = filterText(inputVal);
                  if(result && result.length > 0) {
                    currentSuggestionList = result;
                    currentSuggestionCursor = 0;
                    setText(currentSuggestionList[0])
                  }
                  else {
                    // check for repeat
                    inputVal = input.val();

                    // cycle selection
                    if(endsWith(letter, inputVal) &&
                        currentSuggestionList &&
                        currentSuggestionList.length > 1) {

                      currentSuggestionCursor++;
                      if(currentSuggestionCursor >= currentSuggestionList.length) {
                        currentSuggestionCursor = 0;
                      }
                      setText(currentSuggestionList[currentSuggestionCursor]);
                    }
                  }
                  return false;
                }
                else {
                  suggest.val('');
                  currentSuggestion = null;
                }
                return notLetter;
              }
          }
          
        })

        .bind('paste', function() {
          GWR.Log('paste' , input.val(), arguments);
          return false;
        })

        .blur(function() {
          if(lastpress == 'key' && !opts.readonly) {
            // Check if a current suggestion exists
            if(opts.autocomplete && input.val() != '') {
              setInputValues(currentSuggestion);
            }
            else {
              setInputValues();

              // Remove suggest text
              suggest.val('');
            }

            // Hide dropdown region
            toggleList(false);
          }

          // if keyboard arrows were used,
          // set input to last highlighted item
          else if (lastpress == 'arrow') {
            var current = $('li.hover', list);
            var data = current.data();
            if(data) {
              setInputValues(data);

              // Remove suggest text
              suggest.val('');
            }

            // Hide dropdown region
            toggleList(false);
          }
          if(lastpress == '') {
            toggleList(false);
          }
        });

        /**
         * Current suggestion text and value
         */
        var currentSuggestion = null;
        var currentSuggestionList = null;
        var currentSuggestionCursor = 0;

        /**
         * Returns true if text starts with search
         */
        var startsWith = function(search, text) {
          if(search && text && 
              text.toLowerCase().indexOf(search.toLowerCase()) == 0) {
            return true;
          }
          return false;
        }

        /**
         * Returns true if text ends with search
         */
        var endsWith = function(search, text) {
          if(search && text &&
              text.toLowerCase().lastIndexOf(search.toLowerCase()) +
              search.length == text.length) {
            return true;
          }
          return false;
        }

        /**
         * Sets input and select values
         */
        var setInputValues = function(data) {
          if(data) {
            input.val(data.text);
            select.val(data.value)
          }
          else {
            input.val('');
            select.val('');
          }
          select.change();
        }

        /**
         * Checks search string and returns an array of possible results.
         * Else returns null.
         */
        var filterText = function(search) {
          var match = [];

          $('li', list).each(function() {
            var data = $(this).data();
            if(startsWith(search, data.text)) {
              match.push(data);
            }
          });

          if(match.length > 0) {
            return match;
          }
          
          return false;
        }

        $(document).click(function() {
          toggleList(false);
        });

        /**
         * Handle mouse clicks
         */
        $('li', list).click(function() {
          var data = $(this).data();
          input.val(data.text);
          select.val(data.value);
          suggest.val('');
          
          currentSuggestion = data;

          // trigger change event on original control
          select.change();

          // Hide the dropdown list
          toggleList(false);

          return false;
        });
      }
      return opts;
    }
  }

})();