/**
 * Portfolio Index block (editor).
 *
 * Written without JSX so the file runs as-is from build/ and also compiles
 * unchanged through `npm run build`.
 */
( function ( wp ) {
	const { registerBlockType } = wp.blocks;
	const { createElement: el, Fragment } = wp.element;
	const { __ } = wp.i18n;
	const { InspectorControls, useBlockProps, PanelColorSettings } = wp.blockEditor;
	const { PanelBody, SelectControl, RangeControl, ToggleControl, TextControl, Disabled } = wp.components;
	const { useSelect } = wp.data;
	const ServerSideRender = wp.serverSideRender;

	registerBlockType( 'wpzoom-blocks/portfolio-index', {
		apiVersion: 3,
		title: __( 'Portfolio Index', 'wpzoom-portfolio' ),
		description: __( 'A numbered list of projects. Hovering a title previews the project beside the list, and the preview stays while you move the cursor to it.', 'wpzoom-portfolio' ),
		icon: 'editor-ol',
		category: 'wpzoom-blocks',
		keywords: [ __( 'portfolio', 'wpzoom-portfolio' ), __( 'index', 'wpzoom-portfolio' ), __( 'video', 'wpzoom-portfolio' ), __( 'projects', 'wpzoom-portfolio' ) ],
		supports: {
			align: [ 'wide', 'full' ],
			html: false,
			spacing: { margin: true, padding: true },
			typography: { __experimentalFontFamily: true },
		},

		edit: function ( props ) {
			const { attributes: a, setAttributes } = props;
			const blockProps = useBlockProps();

			const terms = useSelect( function ( select ) {
				return select( 'core' ).getEntityRecords( 'taxonomy', 'portfolio', { per_page: -1, hide_empty: false } );
			}, [] );
			const categoryOptions = [ { label: __( 'All', 'wpzoom-portfolio' ), value: '' } ].concat(
				( terms || [] ).map( function ( t ) {
					return { label: t.name + ' (' + t.count + ')', value: t.slug };
				} )
			);

			const toggle = function ( label, key, help ) {
				return el( ToggleControl, {
					label: label,
					help: help,
					checked: !! a[ key ],
					onChange: function ( v ) {
						const next = {};
						next[ key ] = v;
						setAttributes( next );
					},
				} );
			};

			const range = function ( label, key, min, max ) {
				return el( RangeControl, {
					label: label,
					value: a[ key ],
					min: min,
					max: max,
					onChange: function ( v ) {
						const next = {};
						next[ key ] = v;
						setAttributes( next );
					},
				} );
			};

			return el(
				Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'Projects', 'wpzoom-portfolio' ), initialOpen: true },
						el( SelectControl, {
							label: __( 'Category', 'wpzoom-portfolio' ),
							value: a.category,
							options: categoryOptions,
							onChange: function ( v ) { setAttributes( { category: v } ); },
						} ),
						range( __( 'Number of projects', 'wpzoom-portfolio' ), 'amount', 1, 50 ),
						el( SelectControl, {
							label: __( 'Order', 'wpzoom-portfolio' ),
							value: a.order,
							options: [
								{ label: __( 'Newest first', 'wpzoom-portfolio' ), value: 'date' },
								{ label: __( 'Custom order', 'wpzoom-portfolio' ), value: 'menu_order' },
								{ label: __( 'Title', 'wpzoom-portfolio' ), value: 'title' },
							],
							onChange: function ( v ) { setAttributes( { order: v } ); },
						} ),
						el( TextControl, {
							label: __( 'List heading', 'wpzoom-portfolio' ),
							value: a.listLabel,
							onChange: function ( v ) { setAttributes( { listLabel: v } ); },
						} ),
						toggle( __( 'Show numbers', 'wpzoom-portfolio' ), 'showNumbers' ),
						toggle( __( 'Show dotted rail', 'wpzoom-portfolio' ), 'showRail' ),
						toggle( __( 'Italic active title', 'wpzoom-portfolio' ), 'italicActive' )
					),
					el(
						PanelBody,
						{ title: __( 'Project panel', 'wpzoom-portfolio' ), initialOpen: false },
						el( SelectControl, {
							label: __( 'On title click', 'wpzoom-portfolio' ),
							help: __( 'Hovering a title always previews the project. On phones the panel is hidden and titles link to the project page.', 'wpzoom-portfolio' ),
							value: a.clickAction,
							options: [
								{ label: __( 'Open the project in the panel', 'wpzoom-portfolio' ), value: 'panel' },
								{ label: __( 'Go to the project page', 'wpzoom-portfolio' ), value: 'post' },
							],
							onChange: function ( v ) { setAttributes( { clickAction: v } ); },
						} ),
						toggle( __( 'Show the first project on load', 'wpzoom-portfolio' ), 'openFirst' ),
						toggle( __( 'Play the hover video in the panel', 'wpzoom-portfolio' ), 'previewVideo' ),
						el( SelectControl, {
							label: __( 'Media aspect ratio', 'wpzoom-portfolio' ),
							value: a.mediaRatio,
							options: [
								{ label: '16:9', value: '16/9' },
								{ label: __( 'Cinema (2.39:1)', 'wpzoom-portfolio' ), value: '2.39/1' },
								{ label: '4:3', value: '4/3' },
								{ label: __( 'Square', 'wpzoom-portfolio' ), value: '1/1' },
							],
							onChange: function ( v ) { setAttributes( { mediaRatio: v } ); },
						} ),
						range( __( 'Media corner radius (px)', 'wpzoom-portfolio' ), 'mediaRadius', 0, 48 ),
						toggle( __( 'Show year', 'wpzoom-portfolio' ), 'showYear' ),
						toggle( __( 'Show director & client', 'wpzoom-portfolio' ), 'showDetails' ),
						toggle( __( 'Show excerpt', 'wpzoom-portfolio' ), 'showExcerpt' ),
						el( TextControl, {
							label: __( 'Project link text', 'wpzoom-portfolio' ),
							value: a.moreText,
							onChange: function ( v ) { setAttributes( { moreText: v } ); },
						} )
					),
					el(
						PanelBody,
						{ title: __( 'Layout', 'wpzoom-portfolio' ), initialOpen: false },
						range( __( 'List width (%)', 'wpzoom-portfolio' ), 'listWidth', 20, 70 ),
						range( __( 'Gap (px)', 'wpzoom-portfolio' ), 'columnGap', 0, 200 ),
						range( __( 'Space between titles (px)', 'wpzoom-portfolio' ), 'itemGap', 0, 60 ),
						range( __( 'Title size (px)', 'wpzoom-portfolio' ), 'titleSize', 14, 80 ),
						range( __( 'Panel title size (px)', 'wpzoom-portfolio' ), 'panelTitleSize', 14, 80 ),
						range( __( 'Panel sticky offset (px)', 'wpzoom-portfolio' ), 'stickyTop', 0, 300 )
					),
					el( PanelColorSettings, {
						title: __( 'Color', 'wpzoom-portfolio' ),
						initialOpen: false,
						colorSettings: [
							{
								label: __( 'Text', 'wpzoom-portfolio' ),
								value: a.textColor,
								onChange: function ( v ) { setAttributes( { textColor: v || '' } ); },
							},
						],
					} )
				),
				el(
					'div',
					blockProps,
					el( Disabled, null, el( ServerSideRender, { block: 'wpzoom-blocks/portfolio-index', attributes: a } ) )
				)
			);
		},

		save: function () {
			return null;
		},
	} );
}( window.wp ) );
