/**
 * TAXONOMY BROWSER - Braije Christophe 2022
 * Review 3 - 2023
 */

((taxonomy) => {

  /**
   * PRIVATE - Capitalize
   * Capitalize the first letter of a string
   *
   * @param {string} str
   */

  const _capitalizeFirstLetter = (str = '') => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * PRIVATE - Build
   * Build the main layout area of "taxonomy".
   *
   * @param {*} container
   */

  const _build = (container) => {

    container.innerHTML = `
        <div class="wt-taxonomy--tags">
          <span class="wt-taxonomy--notag">
            <span class="wt-icon-spinner"></span>
            Loading data ...
          </span>
        </div>
        <button
          class="wt-taxonomy--browse"
          type="button"
          aria-controls="modal_${container.ui.id}"
          disabled
        >
          Add tags
        </button>
        <div
          id="modal_${container.ui.id}"
          class="wt-taxonomy--modal unselected"
          role="dialog"
          hidden
        >
          <h2 class="unselected">
            Taxonomy <span>browser</span>
            <button type="button" aria-controls="modal_${container.ui.id}">✖</button>
          </h2>
          <div class="unselected wt-taxonomy--modal-search">
            <input
              type="search"
              placeholder="Search..."
            >
          </div>
          <div class="wt-taxonomy--modal-body">
            <div class="wt-taxonomy--tree"></div>
            <div class="wt-taxonomy--search-result"></div>
          </div>
          <div class="unselected wt-taxonomy--modal-footer">
            <div class="wt-taxonomy--modal-selected-tags">
              <h3>Selected tags</h3>
              <div class="wt-taxonomy--tags wt-taxonomy--tags-selected">
                ...
              </div>
            </div>
            <div class="wt-taxonomy--modal-actions">
              <button
                type="button"
                data-inject="true"
                disabled
              >
                Add tags and close
              </button>
            </div>
          </div>
        </div>
      `;

  };

  /**
   * PRIVATE - Field update
   * Update original field and synchronize the tags list content based on "container.current".
   *
   * @param {*} container
   */

  const _fieldUpdate = (container) => {

    // Reference.
    let terms = container.current;
    let total = Object.keys(terms);

    // Forward to selected.
    container.selectedArea = container.database.filter(row => {
      return container.current[row.id];
    });

    // Reset tags "field" value.
    container.ui.tags.innerHTML = (total.length) ? total.map((name) => {
      return  `<span class="wt-unselected">${terms[name]} <b data-remove="${name}">✖</b></span>`;
    }).join('') : '<span class="wt-taxonomy--notag">No tags have been selected.</span>';

    // Update the original field value.
    container.ui.target.value = JSON.stringify(container.current);

    // Forward markup to modal.
    _selectedAreaUpdate(container);

  };

  /**
   * PRIVATE - Selected area in the modal.
   * Update the selected area in the modal based on t he "container.selectedArea".
   *
   * @param {*} container
   */

  const _selectedAreaUpdate = (container) => {

    // Reference.
    let terms = container.selectedArea;

    container.ui.selected.innerHTML = (terms.length) ? terms.map((row) => {
      let name = _capitalizeFirstLetter(row.prefLabel);

      return  `<span class="wt-unselected">${name} <b data-remove="${row.id}">✖</b></span>`;
    }).join('') : '';

  };

  /**
   * TODO: JSON FORMAT!
   *
   * @param {*} container
   * @param {*} row
   * @param {*} nearTree
   * @param {*} asRelated
   * @returns
   */

  const _getTag = (container, row, nearTree, asRelated) => {

    // References.
    let id = row.id;
    let tag = _capitalizeFirstLetter(row.prefLabel);
    let isSearch = container.ui.search.value.trim();
    let isLabel = (isSearch && row.search?.label);
    let isRelated = (isSearch && row.search?.related);
    let isExclude = (!isLabel) ? 'wt-taxonomy--tree-exclude' : '';
    let actionType = (!isLabel && isSearch) ? 'exclude' : 'add';
    let isTree = (nearTree) ? 'wt-taxonomy--button-nearcollapse' : '';
    let isSelected = container.selectedArea.filter(row => row.id === id).length;

    if (isRelated && asRelated) {
      actionType = "add";
    }

    return `<span class="wt-taxonomy--button-add ${isTree} ${isExclude}"
      data-${actionType}="${id}"
      ${isSelected ? ' disabled' : ''}
    >${_searcHighlighted(container, tag)}</span>`;

  };

  /**
   * PRIVATE - Search highlighted
   *
   * @param {*} container
   * @param {*} str
   * @returns
   */

  const _searcHighlighted = (container, str) => {
    return container.ui.search.value ?
      str.replace(new RegExp(container.ui.search.value, "ig"), "<u>$&</u>") : str;
  };

  /**
   * PRIVATE - Search
   * Perform a query search based on "container.database".
   *
   * @param {*} container
   * @returns
   */

  const _search = (container) => {

    let searchWord = container.ui.search.value.toLowerCase();

    container.ui.result.innerHTML = '';

    // Update UI tags based from selected area.
    _updateSelectedTags(container);

    // At least 3 letters.
    if (searchWord.length < 3) {
      container.ui.result.style.display = "none";
      container.ui.tree.style.display = "block";

      return;
    }

    // Filter out based on the main data.
    let result = container.database.map(row => {

      // References.
      let inLabel = ((row.prefLabel||"").toLowerCase()).indexOf(searchWord) > -1;
      let inSynonymAsString = (row.synonyms||[]).indexOf(searchWord) > -1;
      let inSynonymAsArray = (row.synonyms||[]).filter(r => {
        return r.indexOf(searchWord) > -1;
      }).length;
      let inRelated = (row.related||[]).filter(r => {
        return ((r.prefLabel||"").toLowerCase()).indexOf(searchWord) > -1;
      }).length;

      // Add extra data search info.
      row.search = {
        found: !!(inLabel || inSynonymAsString || inSynonymAsArray || inRelated),
        label: inLabel,
        synonyms: inSynonymAsString || inSynonymAsArray,
        related: inRelated
      };

      return row;

    })

      // Keep only found and exclude current selection
      .filter(row => {
        return row.search.found && !container.current[row.id]
      })

      // Force found on top.
      .sort((a, b) => b.search.label - a.search.label);

    // Switch UI.
    container.ui.result.style.display = "block";
    container.ui.tree.style.display = "none";

    // Show result.
    if (result.length) {
      _searchResult(container, result);
    }

    // Fallback of empty result.
    else {
      container.ui.result.innerHTML = "No tags found based from your criteria.";
    }

  };

  /**
   * PRIVATE - Build search result
   *
   * @param {*} container
   * @param {*} result
   */

  const _searchResult = (container, result) => {

    // References.
    let content = '<ul class="tree">';

    // Display root.
    content += result.map(row => {
      return _treeGetTag(container, row);
    }).join('');

    // Underline term of search.
    container.ui.result.innerHTML = content + "</ul>";

    // Move the response result at top.
    container.ui.result.scrollTo(0,0);

  };

  /**
   * PRIVATE - Tree node
   * Build the basis markup for any new tag with tree.
   *
   * @param {*} container
   * @param {*} row
   * @returns
   */

  const _treeGetTag = (container, row) => {

    // References.
    let id = row.id;
    let tag = _getTag(container, row, true);

    // Markup.
    return `
      <li class="wt-taxonomy--tree-root">
        <details class="wt-taxonomy--tree-extra">
          <summary data-expand="${id}">&nbsp;</summary>
          <div><!-- TARGET CONTAINER --></div>
        </details>
        ${tag}
      </li>
    `;
  };

  /**
   * PRIVATE - Build tree root menu
   * Build the root tree of the menu.
   *
   * @param {*} container
   * @param {*} result
   */

  const _treeRoot = (container) => {

    let content = '<ul class="tree wt-taxonomy--tree-menu">';

    container.database

      // Keep only root.
      .filter(row => !row.broader)

      // Alpha order.
      .sort((a, b) => {
        let A = a.prefLabel.toUpperCase();
        let B = b.prefLabel.toUpperCase();

        return A.localeCompare(B, 'en', {
          ignorePunctuation: true
        });
      })

      // Display root.
      .map(row => {
        content += _treeGetTag(container, row);
      });

    content += '</ul>';

    // Update tree ui content.
    container.ui.tree.innerHTML = content;

    // TIPS: scroll to top.
    container.ui.tree.scrollTo(0,0);

  };

  /**
   * PRIVATE - Tree expand
   * Build the child tree content of each node tag.
   *
   * @param {*} container
   * @param {*} elm
   * @param {*} what
   */

  const _treeExpand = (container, elm, id) => {

    let details = elm.parentNode;

    // ... and is not already process.
    if (details.querySelector('ul')) {
      return
    }

    // Get data node reference.
    let about = container.database.filter(row => {
      return row.id === id;
    })[0];

    // Start building the child content.
    let content = '<ul>';

    // Definition.
    if (about.definition) {

      content += `
        <li class="wt-taxonomy--section-description">
          <details open>
            <summary class="wt-taxonomy--tree-noicon">
              Description
            </summary>
            <p>${about.definition}</p>
          </details>
        </li>
      `;

    }

    // Synonyms.
    if (about.synonyms) {

      let synonyms = about.synonyms.map(row => {
        return _capitalizeFirstLetter(row);
      }).join(', ');

      content += `
        <li class="wt-taxonomy--section-synonym">
          <details open>
            <summary class="wt-taxonomy--tree-noicon">
              Synonym(s)
            </summary>
            <p>${_searcHighlighted(container, synonyms)}</p>
          </details>
        </li>
      `;

    }

    // Related.
    if (about.related) {

      let related = about.related.map(row => {
        return _getTag(container, row, false, true);
      }).join('');

      content += `
        <li class="wt-taxonomy--section-related">
          <details open>
            <summary class="wt-taxonomy--tree-noicon">
              Related tag(s)
            </summary>
            <p>${related}</p>
          </details>
        </li>
      `;

    }

    // Narrower.
    if (about.narrower && !container.ui.search.value) {

      let narrower = about.narrower.map(row => {
        return _treeGetTag(container, row);
      }).join('');

      content += `
        <li class="wt-taxonomy--tree-root wt-taxonomy--section-narrower">
          <details class="wt-taxonomy--tree-extra" open>
            <summary class="wt-taxonomy--tree-noicon">
              Narrower tag(s)
            </summary>
            <ul>${narrower}</ul>
          </details>
        </li>
      `;

    }

    // Update child.
    details.querySelector('div').innerHTML = content + `</ul>`;

  };

  /**
   * PRIVATE - Update TAGS status
   * Update the status of each tags in the UI based on current or selected data.
   *
   * @param {*} container
   * @param {*} from
   */

  const _updateSelectedTags = (container, from) => {

    // Remove all visible selected tags.
    [...container.ui.modal.querySelectorAll('span[data-add]')].map(elm => {
      elm.removeAttribute("disabled");
    });

    // Update UI tags based from: current selection or selected area?
    let dataFrom = (from) ? Object.keys(container.current) : container.selectedArea.map(row => {
      return row.id;
    });

    // Restore all visible selected tags.
    dataFrom.map(id => {
      [...container.ui.modal.querySelectorAll(`span[data-add="${id}"]`)].map(elm => {
        elm.setAttribute('disabled', true);
      });
    });

  };

  /**
   * PRIVATE - Add tags and close button
   * Toggle the status (disabled) on the tags and close button based on data compare.
   *
   * @param {*} container
   */

  const _toggleAddAndClose = (container) => {

    let current = Object.keys(container.current).length;
    let selected = container.selectedArea.filter(row => container.current[row.id]).length;

    if (current === selected && container.selectedArea.length === selected) {
      return container.ui.addAndClose.setAttribute('disabled', true);
    }

    return container.ui.addAndClose.removeAttribute('disabled');
  };

  /**
   * PUBLIC
   */

  $wt.taxonomy = {

    run: (container) => {

      // Default parameters.
      container.params = $wt.mergeParams({
        "target" : false
      }, container.params);

      // UI references.
      container.ui = {
        id: $wt.id(),
        target: document.querySelector(container.params.target)
      };

      // Mandatory.
      if (!container.ui.target) {
        $wt.next(container);

        return;
      }

      // Force container moving after the target.
      $wt.after(container, container.ui.target);

      // Field target updated.
      container.ui.target.setAttribute("readonly", true);
      container.ui.target.style.display = "none";

      // Build main layout.
      _build(container);

      // Magic aria.
      $wt.aria(container);

      // Update UI references.
      container.ui.tags = container.querySelector('.wt-taxonomy--tags');
      container.ui.search = container.querySelector('.wt-taxonomy--modal-search input');
      container.ui.result = container.querySelector('.wt-taxonomy--search-result');
      container.ui.tree = container.querySelector('.wt-taxonomy--tree');
      container.ui.selected = container.querySelector('.wt-taxonomy--tags-selected');
      container.ui.addtags = container.querySelector('button.wt-taxonomy--browse');
      container.ui.addAndClose = container.querySelector('.wt-taxonomy--modal-actions button');
      container.ui.modal = container.querySelector('.wt-taxonomy--modal');

      /**
       * EVENTS - MODAL OPEN
       * Extra job when the modal open. We should refresh all but without rendering again.
       *
       * @param {*} e
       */

      container.ui.addtags.onclick = () => {

        // Do nothing if the modal is closed
        if (container.ui.modal.hidden) {
          return;
        }

        // Reset selected area based on the current selection.
        container.selectedArea = container.database.filter(row => {
          return container.current[row.id];
        });

        // Update UI tags based from current selection.
        _updateSelectedTags(container, true);

        // Update the selected area data.
        _selectedAreaUpdate(container);

        // Update modal validation button.
        _toggleAddAndClose(container);

      };

      /**
       * EVENTS DELEGATION - Tags remove.
       * Remove a tag from the field by clicking on the "X" icon.
       *
       * @param {*} e
       */

      container.ui.tags.onclick = (e) => {
        let remove = e.target.attributes["data-remove"];
        if (remove) {
          delete container.current[remove.value];
          _fieldUpdate(container);
        }
      };

      /**
       * EVENTS - Search.
       * Debounce a search criteria.
       */

      container.ui.search.onclick =
      container.ui.search.onkeyup =
      container.ui.search.onchange = () => {
        $wt.defer(() => {
          _search(container);
        }, 250);
      };

      /**
       * EVENTS DELEGATION - MODAL.
       * Forward each click to the correct method.
       *
       * @param {*} evt
       */

      container.ui.modal.onclick = (evt) => {

        // References.
        let srcElm = evt.target;
        let attr = srcElm.attributes;

        // "Add tags and close" button for injecting new data.
        if (attr["data-inject"] && !attr["disabled"]) {

          // Hide the modal.
          container.ui.modal.setAttribute('hidden', true);

          // Refresh current data reference based on the selected area.
          container.current = container.selectedArea.reduce((what, row) => {
            what[row.id] = _capitalizeFirstLetter(row.prefLabel);

            return what;
          }, {});

          // Update the field value.
          _fieldUpdate(container);

        }

        // Click to expand/collapse.
        else if (attr["data-expand"]) {
          _treeExpand(container, srcElm, attr["data-expand"].value);
        }

        // Click to remove tag from the tree menu or the search result.
        else if (attr["data-add"] && attr["disabled"]) {

          // ID reference.
          let id = attr["data-add"].value;

          // Turn on the tag button.
          srcElm.removeAttribute('disabled');

          // Remove this tag from the selected area data.
          container.selectedArea = container.selectedArea.filter(row => {
            return row.id !== id;
          });

          // Update UI tags based from selected area.
          _updateSelectedTags(container);

          // Update the selected area data.
          _selectedAreaUpdate(container);

          // Restore the add button.
          _toggleAddAndClose(container);
        }

        // Click to add tag to the selected list.
        else if (attr["data-add"]) {

          // ID reference.
          let id = attr["data-add"].value;

          // Get tag info based on ID.
          let about = container.database.filter(row => row.id === id)[0];

          // Add this tag info into the selected area data.
          container.selectedArea.push(about);

          // Turn this tag off (selected).
          srcElm.setAttribute('disabled', true);

          // Update the selected area data.
          _selectedAreaUpdate(container);

          // Restore the add button.
          _toggleAddAndClose(container);
        }

        // Click to remove tag from the selected list (using X icon).
        else if (attr["data-remove"]) {

          // ID reference.
          let id = attr["data-remove"].value;

          // Remove this tag from the selected area data.
          container.selectedArea = container.selectedArea.filter(row => {
            return row.id !== id
          });

          // Turn the tag button on.
          srcElm.removeAttribute('disabled');

          // Update "tree" and "search result" area tags button.
          [...container.ui.modal.querySelectorAll(`span[data-add="${id}"]`)].map(elm => {
            elm.removeAttribute('disabled');
          });

          _selectedAreaUpdate(container);

          // Restore the add button.
          _toggleAddAndClose(container);
        }

      };

      /**
       * LOAD DATABASE REFERENCES
       */

      $wt.getFile({

        // ACC: url: "https://webgate.acceptance.ec.europa.eu/sml/rest/wtag/data",
        url: "./data2.json",
        type: "json",
        error: console.log,
        success: (res) => {

          let from = container.ui.target.value;

          // References data.
          container.current = (from) ? JSON.parse(from) : {};
          container.database = res.data || res;
          container.selectedArea = [];

          // console.log("DATA", container.database);

          // Ui
          setTimeout(() => {

            // Restore button.
            container.ui.addtags.removeAttribute('disabled');

            _fieldUpdate(container);

            _treeRoot(container);

          }, 250);

        }
      });

    }

  };

})();
