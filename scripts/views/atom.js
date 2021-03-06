define(function(require)
{
	var _          = require("underscore");
	var EditorView = require('views/editor_base');
	var Template   = require("text!templates/atom.tpl");
	var vent       = require("vent");

	return EditorView.extend({
		template: _.template(Template),

		templateHelpers: function() {
			return {
				item_list_selection: this.hasItemListSelection(),

				quantity_visible: this.isQuantityVisible(),
				content_visible:  this.isContentVisible (),
				location_visible: this.isLocationVisible(),

				content_items:          this.isContentItems(),
				content_tags:           this.isContentTags(),
				content_plaques:        this.isContentPlaques(),
				content_dialogs:        this.isContentDialogs(),
				content_dialog_scripts: this.isContentDialogScripts(),
				content_web_pages:      this.isContentWebPages(),
				content_quests:         this.isContentQuests(),
				content_web_hooks:      this.isContentWebHooks(),

				items: this.items,
				tags: this.tags,
				plaques: this.plaques,
				dialogs: this.dialogs,
				dialog_scripts: this.dialog_scripts,
				web_pages: this.web_pages,
				quests: this.quests,
				web_hooks: this.web_hooks
			};
		},

		// Bootstrap
		tagName: 'li',
		className: "list-group-item",

		initialize: function(options) {
			this.items = options.contents.items;
			this.tags = options.contents.tags;
			this.plaques = options.contents.plaques;
			this.dialogs = options.contents.dialogs;
			this.dialog_scripts = options.contents.dialog_scripts;
			this.web_pages = options.contents.web_pages;
			this.quests = options.contents.quests;
			this.web_hooks = options.contents.hooks;
		},

		ui: {
			operator:    ".boolean-operator",
			requirement: ".requirement",
			content:     ".content",
			quantity:    ".quantity",
			latitude:    ".latitude",
			longitude:   ".longitude",
			distance:    ".distance"
		},

		events: {
			"change @ui.operator":    "onChangeBooleanOperator",
			"change @ui.requirement": "onChangeRequirement",
			"change @ui.content":     "onChangeContent",
			"change @ui.quantity":    "onChangeQuantity",
			"change @ui.distance":    "onChangeDistance",
			"change @ui.latitude":    "onChangeLatitude",
			"change @ui.longitude":   "onChangeLongitude",
			"click .delete-atom":     "onClickDeleteAtom"
		},

		/* Model bindings */

		onChangeBooleanOperator: function() {
			var value = this.ui.operator.find("option:selected").val();
			var type  = this.ui.operator.find("option:selected").data("set");

			// Change requirement to one from proper dropdown
			if(type === "item_list")
			{
				// Switch to value from first list.
				if(!this.hasItemListSelection())
				{
					this.model.set("requirement", "PLAYER_HAS_ITEM");
					this.model.set("content_id", "0");
				}

			}
			else {
				// Switch to value from second list.
				if(this.hasItemListSelection())
				{
					this.model.set("requirement", "PLAYER_VIEWED_DIALOG");
					this.model.set("content_id", "0");
				}
			}

			this.model.set("bool_operator", value);

			this.render();
		},

		onChangeRequirement: function() {
			var value = this.ui.requirement.find("option:selected").val();
			this.model.set("requirement", value);

			// 0 out content ID before re-rendering select
			this.model.set("content_id", "0");
			this.render();
		},

		onChangeContent: function() {
			var value = this.ui.content.find("option:selected").val();
			this.model.set("content_id", value);
		},

		onChangeQuantity:  function() { this.model.set("qty",       this.ui.quantity.val ()); },
		onChangeLatitude:  function() { this.model.set("latitude",  this.ui.latitude.val ()); },
		onChangeLongitude: function() { this.model.set("longitude", this.ui.longitude.val()); },
		onChangeDistance:  function() { this.model.set("distance",  this.ui.distance.val ()); },

		onClickDeleteAtom: function() {
			this.trigger("atom:remove", this.model);
		},

		/* Visibility Logic */

		hasItemListSelection: function() {
			switch(this.model.get("requirement")) {
				case "PLAYER_HAS_ITEM":
				case "PLAYER_HAS_TAGGED_ITEM":
					return true;
				default:
					return false;
			}
		},

		isQuantityVisible: function() {
			switch(this.model.get("requirement")) {
				case "PLAYER_HAS_ITEM":
				case "PLAYER_HAS_TAGGED_ITEM":
				case "PLAYER_HAS_UPLOADED_MEDIA_ITEM":
				case "PLAYER_HAS_UPLOADED_MEDIA_ITEM_IMAGE":
				case "PLAYER_HAS_UPLOADED_MEDIA_ITEM_AUDIO":
				case "PLAYER_HAS_UPLOADED_MEDIA_ITEM_VIDEO":
				case "PLAYER_HAS_NOTE":
				case "PLAYER_HAS_NOTE_WITH_TAG":
				case "PLAYER_HAS_NOTE_WITH_LIKES":
				case "PLAYER_HAS_NOTE_WITH_COMMENTS":
				case "PLAYER_HAS_GIVEN_NOTE_COMMENTS":
					return true;


				default:
					return false;
			}
		},

		isContentVisible: function() {
			switch(this.model.get("requirement")) {
				case "PLAYER_HAS_ITEM":
				case "PLAYER_HAS_TAGGED_ITEM":
				case "PLAYER_VIEWED_ITEM":
				case "PLAYER_VIEWED_PLAQUE":
				case "PLAYER_VIEWED_DIALOG":
				case "PLAYER_VIEWED_DIALOG_SCRIPT":
				case "PLAYER_VIEWED_WEB_PAGE":
				case "PLAYER_HAS_COMPLETED_QUEST":
				case "PLAYER_HAS_RECEIVED_INCOMING_WEB_HOOK":
				case "PLAYER_HAS_NOTE_WITH_TAG":
					return true;

				default:
					return false;
			}
		},

		isLocationVisible: function() {
			switch(this.model.get("requirement")) {
				case "PLAYER_HAS_UPLOADED_MEDIA_ITEM":
				case "PLAYER_HAS_UPLOADED_MEDIA_ITEM_IMAGE":
				case "PLAYER_HAS_UPLOADED_MEDIA_ITEM_AUDIO":
				case "PLAYER_HAS_UPLOADED_MEDIA_ITEM_VIDEO":
					return true;

				default:
					return false;
			}
		},

		/* Content lists visibility logic */
		isContentItems: function() {
			switch(this.model.get("requirement")) {
				case "PLAYER_HAS_ITEM":
				case "PLAYER_VIEWED_ITEM":
					return true;

				default:
					return false;
			}
		},

		isContentTags: function() {
			switch(this.model.get("requirement")) {
				case "PLAYER_HAS_TAGGED_ITEM":
				case "PLAYER_HAS_NOTE_WITH_TAG":
					return true;

				default:
					return false;
			}
		},

		isContentPlaques: function() {
			switch(this.model.get("requirement")) {
				case "PLAYER_VIEWED_PLAQUE":
					return true;

				default:
					return false;
			}
		},

		isContentDialogs: function() {
			switch(this.model.get("requirement")) {
				case "PLAYER_VIEWED_DIALOG":
					return true;

				default:
					return false;
			}
		},

		isContentDialogScripts: function() {
			switch(this.model.get("requirement")) {
				case "PLAYER_VIEWED_DIALOG_SCRIPT":
					return true;

				default:
					return false;
			}
		},

		isContentWebPages: function() {
			switch(this.model.get("requirement")) {
				case "PLAYER_VIEWED_WEB_PAGE":
					return true;

				default:
					return false;
			}
		},

		isContentQuests: function() {
			switch(this.model.get("requirement")) {
				case "PLAYER_HAS_COMPLETED_QUEST":
					return true;

				default:
					return false;
			}
		},

		isContentWebHooks: function() {
			switch(this.model.get("requirement")) {
				case "PLAYER_HAS_RECEIVED_INCOMING_WEB_HOOK":
					return true;

				default:
					return false;
			}
		}
	});
});

