define([
	'underscore',
	'backbone',
	'text!templates/script_editor_option.tpl',
	'views/dialog_option_editor',
	'vent'
], function(_, Backbone, Template, DialogOptionEditor, vent) {
	return Backbone.Marionette.ItemView.extend({
		template: _.template(Template),

		className: "script_option",

		events: {
			"click .edit-option": "onClickEdit"
		},

		initialize: function(options) {
			this.scripts = options.scripts;
			this.dialog  = options.dialog;
			this.script_options = options.script_options;
			this.script_editor_view = options.script_editor_view;

			this.contents = options.contents;

			this.plaques   = options.contents.plaques;
			this.items     = options.contents.items;
			this.web_pages = options.contents.web_pages;
			this.dialogs   = options.contents.dialogs;
			this.tabs      = options.contents.tabs;
		},


		templateHelpers: function() {
			return {
				model: this.model,
				scripts: this.scripts,
				cid: this.model.cid,
				link_icon: this.linkIcon(),
				link_color: this.linkColor()
			}
		},


		onClickEdit: function() {
			var option_editor = new DialogOptionEditor({model: this.model, scripts: this.scripts, contents: this.contents});
			vent.trigger("application:info:show", option_editor);
			return false;
		},


		linkIcon: function() {
			switch(this.model.get("link_type")) {
				case "DIALOG_SCRIPT":
					return "arrow-down";
				case "EXIT":
					return "export";
				case "EXIT_TO_DIALOG":
					return "comment";
				case "EXIT_TO_PLAQUE":
					return "align-justify";
				case "EXIT_TO_ITEM":
					return "stop";
				case "EXIT_TO_WEB_PAGE":
					return "globe";
				case "EXIT_TO_TAB":
					return "list-alt";
			}
		},

		linkColor: function() {
			switch(this.model.get("link_type")) {
				case "DIALOG_SCRIPT":
					return "info";
				case "EXIT":
					return "success";
				case "EXIT_TO_DIALOG":
					return "success";
				case "EXIT_TO_PLAQUE":
					return "success";
				case "EXIT_TO_ITEM":
					return "success";
				case "EXIT_TO_WEB_PAGE":
					return "success";
				case "EXIT_TO_TAB":
					return "success";
			}
		},


		/* Nested rendering */
		onRender: function() {
			if(this.model.get("link_type") === "DIALOG_SCRIPT") {

				var dialog_script = this.scripts.findWhere({dialog_script_id: this.model.get("link_id")});

				// TODO need a handle on events so all related options have a chance to re-render this object if it gets removed elsewhere
				if(dialog_script.get("rendered") === false) {
					var child_view = this.$el.find(".child_script_"+this.model.cid);

					var conversations_editor = new this.script_editor_view({model: dialog_script, collection: dialog_script.get("dialog_options"), dialog: this.dialog, scripts: this.scripts, script_options: this.script_options, contents: this.contents, el: child_view});
					conversations_editor.render();
				}
			}
		}
	});
});