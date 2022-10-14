
$wt.taxonomy = {

  run: function (obj) {

    /**
     * REFERENCE
     */

    let database = [];

    /**
     * MANDATORY
     */

    var field = document.querySelector(obj.params.field);

    if (!field) {
      $wt.next(obj);

      return;
    }

    field.setAttribute("readonly", true);
    field.style.display = "none";

    /**
     * REFERENCES
     */

    var terms = [];

    /**
     * UI
     */

    var container = document.createElement("div");
    container.className = "wt-taxonomy unselected";

    $wt.after(container, field);

    var modal = document.createElement("div");
    modal.className = "wt-taxonomy-modal";

    //$wt.after(modal, container);
    document.body.appendChild(modal);

    var modalMask = document.createElement("div");
    modalMask.className = "wt-taxonomy-modal-mask";

    document.body.appendChild(modalMask);
    //$wt.after(modalMask, container);

    modal.innerHTML = `

      <h2 class="unselected">Taxonomy <span>browser</span> <b data-index="">✖</b></h2>
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

    `;

    /**
     * DELEGATION EVENTS
     */

    container.onclick = function (e) {

      var src = e.target;
      var tag = src.tagName;
      var index = Number(src.getAttribute("data-index"));

      // Remove term.
      if (tag === "B") {

        terms = terms.filter(function (value, i) {
          return index !== i;
        });

        field.value = terms.join(',');

        fieldUpdate();

      }

      // Browse to terms.
      else if (tag === "BUTTON") {

        modal.style.display = "block";
        modalMask.style.display = "block";

        terms = field.value.split(",").filter(function (name) {

          return name.trim() !== '';

        }).map(function (name, index) {

          if (name && database[name]) {

           /* selection.innerHTML += $wt.template([
              "<span>{name} <b data-index='{index}'>✖</b></span>"
            ].join(''), {
              name: name,
              index: String(index)
            });*/

          }

          return name;

        });

      }

    };

    modal.onclick = function (e) {
      modal.style.display = "none";
      modalMask.style.display = "none";
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

      container.innerHTML += "<button>Browse <i>✖</i></button>";

      console.log(terms);

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

    // PUBLIC?
    this.update = fieldUpdate;

  }

};
