define(function(require)
{
	var _                  = require('underscore');
	var Backbone           = require('backbone');
	var Template           = require('text!templates/tab_row.tpl');
	var vent               = require('vent');

	var TabEditorView      = require('views/tab_editor');

	var Media              = require('models/media');
	var Game               = require('models/game');
	var Tab                = require('models/tab');

	var Plaque             = require('models/plaque');
	var Item               = require('models/item');
	var Dialog             = require('models/dialog');
	var WebPage            = require('models/web_page');

	var ItemsCollection    = require('collections/items');
	var PlaquesCollection  = require('collections/plaques');
	var WebPagesCollection = require('collections/web_pages');
	var DialogsCollection  = require('collections/dialogs');


	return Backbone.Marionette.ItemView.extend({
		template: _.template(Template),

		// Bootstrap
		tagName: 'a',
		className: "list-group-item",

		events: {
			"click": "onClickEdit"
		},

		modelEvents: {
			"change": "render"
		},

		templateHelpers: function() {
			return {
				display_type: this.model.get("name") !== "" && this.model.get("name") !== this.model.tab_type_name(),
				tab_type: this.model.tab_type_name(),
				tab_name: this.tab_name()
			}
		},


		/* Name display logic */

		tab_name: function()
		{
			return this.model.get("name") || this.tab_object_name() || "(unnamed tab)"
		},

		tab_object_name: function()
		{
			if(this.model.get("content_id") === "0")
			{
				return this.model.tab_type_name() || "(no type set)";
			}

			return this.game_object.get("name") || "(unnamed object)";
		},


		/* Constructor */

		initialize: function()
		{
			this.bindAssociation();
			this.loadAssociation();
		},


		/* Crud */

		onClickEdit: function() {
			var view = this;

			var game = this.model.game();

			var contents = {
				plaques:    new PlaquesCollection  ([], {parent: game}),
				items:      new ItemsCollection    ([], {parent: game}),
				web_pages:  new WebPagesCollection ([], {parent: game}),
				dialogs:    new DialogsCollection  ([], {parent: game}),
			};

			$.when(contents.plaques.fetch(), contents.items.fetch(), contents.web_pages.fetch(), contents.dialogs.fetch()).done(function()
			{
				var tab_editor = new TabEditorView({model: view.model, contents: contents});
				vent.trigger("application:popup:show", tab_editor, "Edit Tab");
			});
		},


		/* Association Binding */

		loadAssociation: function() {
			this.unbindAssociation();

			var content_class = {
				"DIALOG": Dialog,
				"ITEM": Item,
				"PLAQUE": Plaque,
				"WEB_PAGE": WebPage
			}

			var object_class = content_class[this.model.get("type")];
			var object_id    = this.model.get("content_id");

			if(object_class && object_id)
			{
				this.game_object = new object_class({game_id: this.model.game().id});
				this.game_object.set(this.game_object.idAttribute, object_id);
				this.bindAssociation();
				this.game_object.fetch();
			}
		},

		unbindAssociation: function() {
			this.stopListening(this.game_object);
		},

		bindAssociation: function() {
			if(this.game_object)
			{
				this.listenTo(this.game_object, 'change', this.render);// function() { console.log("got it", arguments) ;});
			}
			this.listenTo(this.model, 'change:content_id', this.loadAssociation);
		},

	});
});
