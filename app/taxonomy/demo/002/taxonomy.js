
$wt.taxonomy = {

  run: (obj) => {

    /**
     * REFERENCE
     */

    let database = [];

    /**
     * MANDATORY
     */

    const field = document.querySelector(obj.params.field);

    if (!field) {
      $wt.next(obj);

      return;
    }

    field.setAttribute("readonly", true);
    //field.style.display = "none";

    /**
     * REFERENCES
     */

    let terms = [];

    /**
     * UI
     */

    let id = "modal_" + $wt.id();

    // Input fake.
    let container = document.createElement("div");
    container.className = "wt-taxonomy unselected";
    $wt.after(container, field);

    // Modal.
    let modal = document.createElement("div");
    modal.className = "wt-taxonomy-modal";
    modal.id = id;
    modal.setAttribute('hidden', true);
    document.body.appendChild(modal);

    // Mask.
    let modalMask = document.createElement("div");
    modalMask.className = "wt-taxonomy-modal-mask " + id;
    modalMask.setAttribute('hidden', true);
    document.body.appendChild(modalMask);

    modal.innerHTML = $wt.template(`

      <h2 class="unselected">
        Taxonomy <span>browser</span>
        <button aria-controls="{id}">✖</button>
      </h2>
      <div class="unselected wt-taxonomy-modal-search">
        <input placeholder="Search...">
      </div>
      <div class="unselected wt-taxonomy-modal-content">

        <h6 class="suggestion">Suggestions:</h6>

        <div><strong>cinema</strong><b>✖</b></div>
        <div><strong>toto</strong><b>✖</b></div>
        <div><strong>tutu</strong><b>✖</b></div>

      </div>
      <div class="unselected wt-taxonomy-modal-footer">
        <button>Save</button>,
        <button>Cancel</button>,
      </div>

    `, {
      id: id
    });

    $wt.aria(modal);

    /**
     * DELEGATION EVENTS
     */

    container.onclick = (e) => {

      let src = e.target;
      let tag = src.tagName;
      let index = src.getAttribute("data-index");

      // Remove term.
      if (tag === "B") {

        terms = terms.filter((value, i) => {
          return index !== value;
        });

        field.value = terms.join(',');

        fieldUpdate();

      }

    };

    /**
     * FIELD TO BULLET
     */

    const fieldUpdate = () => {

      container.innerHTML = '';

      /**
       * LIST OF TERMS
       */

      terms = field.value.split(",").filter((name) => {

        return name.trim() !== '';

      }).map((name, index) => {

        var n = name.trim();

        database.filter(row => {
          return row.id === n;
        }).map(row => {

          container.innerHTML += $wt.template([
            "<span>{name} <b data-index='{index}'>✖</b></span>"
          ].join(''), {
            name: row.name,
            index: row.id
          });

        });

        return n;

      });

      // Browser.
      container.innerHTML += $wt.template(
        "<button aria-controls='{id}'>Browse <i>✖</i></button>"
      , {
        id: id
      });

      $wt.aria(container);

    };

    /**
     * LOAD DATABASE REFERENCES
     */

    $wt.getFile({
      url: "./data/taxonomy_" + document.lang + ".json",
      type: "json",
      error: console.log,
      success: (res) => {
        database = res;
        fieldUpdate();
      }
    });

  }

};
