import apiFetch from '@wordpress/api-fetch';
import {
	InspectorControls,
	PanelColorSettings,
	AlignmentControl,
	useBlockProps
} from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import {
	BaseControl,
	Button,
	ButtonGroup,
	Disabled,
	HorizontalRule,
	PanelBody,
	Placeholder,
	RadioControl,
	RangeControl,
	SelectControl,
	Spinner,
	TextControl,
	ToggleControl,
	TreeSelect,
	ColorPalette,
	Tooltip,
	Popover
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
const { __ } = wp.i18n;
import { groupBy } from 'lodash';
import ServerSideRender from '@wordpress/server-side-render';

/**
 * Internal dependencies
 */
import {
	blockColors,
	secondaryColors
} from './colors-palette';
import fontFamilies from './fonts';
import {
	textTransformOptions,
	fontWeightOptions,
	fontFamilyOptions,
} from './typography-settings.js';
import {
	borderStyleOptions
} from './style-settings.js';
import {
	colorIcon,
	fieldsIcon,
	filterIcon,
	layoutIcon,
	settingsIcon,
	shortcodeIcon
} from '../../icons';

/**
 * Module Constants
 */
const {
    setting_options,
	is_pro,
	plugin_url
} = wpzoomPortfolioBlock;

function buildTermsTree( flatTerms ) {
	const flatTermsWithParentAndChildren = flatTerms.map( ( term ) => {
		return {
			children: [],
			parent: null,
			...term,
		};
	} );

	const termsByParent = groupBy( flatTermsWithParentAndChildren, 'parent' );
	if ( termsByParent.null && termsByParent.null.length ) {
		return flatTermsWithParentAndChildren;
	}
	const fillWithChildren = ( terms ) => {
		return terms.map( ( term ) => {
			const children = termsByParent[ term.id ];
			return {
				...term,
				children:
					children && children.length
						? fillWithChildren( children )
						: [],
			};
		} );
	};

	return fillWithChildren( termsByParent[ '0' ] || [] );
}

function dynamicSort( property ) {
	var sortOrder = 1;

	if ( property[0] === '-' ) {
		sortOrder = -1;
		property = property.substr( 1 );
	}

	return function( a, b ) {
		if ( sortOrder == -1 ) {
			return b[ property ].localeCompare( a[ property ] );
		} else {
			return a[ property ].localeCompare( b[ property ] );
		}
	}
}

function PortfolioEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const isPro = is_pro || false;

	const { taxonomyList, categoriesList } = useSelect( ( select ) => {
		const { getEntityRecords } = select( 'core' );

		var cats = [];
		var taxonomies = [];

		var cats1 = getEntityRecords( 'taxonomy', 'portfolio', { per_page: -1, hide_empty: false } );
		if ( Array.isArray( cats1 ) ) taxonomies.push( ...cats1 );

		var cats2 = getEntityRecords( 'taxonomy', 'category', { per_page: -1, hide_empty: false } );
		if ( Array.isArray( cats2 ) ) cats.push( ...cats2 );

		cats.sort( dynamicSort( 'name' ) );
		cats.unshift( { id: -1, name: __( 'All', 'wpzoom-portfolio' ) } );

		taxonomies.sort( dynamicSort( 'name' ) );
		taxonomies.unshift( { id: -1, name: __( 'All', 'wpzoom-portfolio' ) } );

		return {
			taxonomyList: taxonomies,
			categoriesList: cats,
		};
	} );

	const [ imageSizes, setImageSizes ] = useState( [] );
	const [ showEccentricTooltip, setShowEccentricTooltip ] = useState( false );

	useEffect( () => {
		let isMounted = true;

		apiFetch( { path: '/wpzoom-blocks/v1/image-sizes' } )
			.then( ( sizes ) => {
				if ( isMounted ) setImageSizes( sizes );
			} )
			.catch( () => {
				if ( isMounted ) setImageSizes( [] );
			} );

		return () => { isMounted = false; };
	}, [] );

	function onShortcodeClick( event ) {
		window.getSelection().selectAllChildren( event.target );
	}

	function onShortcodeCopy( event ) {
		const copyText = window.getSelection().toString().replace( /[\n\r]+/g, '' );
		event.clipboardData.setData( 'text/plain', copyText );
		event.preventDefault();
	}

	const { amount, categories, columnsAmount, columnsGap, layout, lazyLoad, lightbox, style,
			lightboxCaption, order, orderBy, readMoreLabel, showAuthor, showCategoryFilter, enableAjaxLoading, showDate,
			showExcerpt, showReadMore, showThumbnail, showViewAll, source, thumbnailSize, viewAllLabel, viewAllLink, primaryColor, secondaryColor, filterActiveColor, filterAlignment, filterFontSize, filterFontFamily, filterTextTransform, filterLetterSpacing, filterFontWeight, postTitleFontSize, postTitleFontSizeMobile,
			postTitleTextTransform, postTitleLetterSpacing, postTitleFontFamily, postTitleFontWeight, postTitleLineHeight, postTitleColor, postHoverTitleColor, btnTextColor, btnHoverTextColor, btnBgColor, btnHoverBgColor, btnFontFamily, btnFontSize, btnTextTransform, btnLetterSpacing, btnBorder, btnBorderStyle, btnBorderWidth,
			btnBorderColor, btnHoverBorderColor, btnBorderRadius, itemBorderRadius, showTitle, hideTitleOnHover, alwaysPlayBackgroundVideo, layoutBgOpacity, layoutBgOpacityHover, showCategory, eccentricDarkMode, entireItemClickable } = attributes;

	const post_type = wp.data.select( 'core/editor' ).getCurrentPostType();
	const post_id   = wp.data.select( 'core/editor' ).getCurrentPost().id;

	if ( ! taxonomyList || ! imageSizes ) {
		return (
			<div { ...blockProps }>
				<Placeholder icon="list-view" label={ __( 'WPZOOM Portfolio', 'wpzoom-portfolio' ) }>
					<Spinner /> { __( 'Loading...', 'wpzoom-portfolio' ) }
				</Placeholder>
			</div>
		);
	}

	const termsTree = buildTermsTree( taxonomyList );
	const catTree   = buildTermsTree( categoriesList );

	let fields = <>
		{ 'eccentric' == layout &&
			<ToggleControl
				label={ __( 'Show Category', 'wpzoom-portfolio' ) }
				checked={ showCategory }
				onChange={ ( value ) => setAttributes( { showCategory: value } ) }
			/>
		}

		<HorizontalRule />

		{ 'eccentric' !== layout &&
			<ToggleControl
				label={ __( 'Show Author', 'wpzoom-portfolio' ) }
				checked={ showAuthor }
				onChange={ ( value ) => setAttributes( { showAuthor: value } ) }
			/>
		}
		{ 'eccentric' !== layout &&
			<HorizontalRule />
		}

		{ 'eccentric' !== layout &&
			<ToggleControl
				label={ __( 'Show Date', 'wpzoom-portfolio' ) }
				checked={ showDate }
				onChange={ ( value ) => setAttributes( { showDate: value } ) }
			/>
		}
		{ 'eccentric' !== layout &&
			<HorizontalRule />
		}

		<ToggleControl
			label={ __( 'Show Excerpt', 'wpzoom-portfolio' ) }
			checked={ showExcerpt }
			onChange={ ( value ) => setAttributes( { showExcerpt: value } ) }
		/>

		<HorizontalRule />

		<ToggleControl
			label={ __( 'Show Read More Button', 'wpzoom-portfolio' ) }
			checked={ showReadMore }
			onChange={ ( value ) => setAttributes( { showReadMore: value } ) }
		/>

		{ showReadMore &&
			<TextControl
				label={ __( 'Read More Button Label', 'wpzoom-portfolio' ) }
				value={ readMoreLabel }
				onChange={ ( value ) => setAttributes( { readMoreLabel: value } ) }
			/>
		}
	</>;

	if ( 'list' != layout && 'eccentric' != layout ) {
		fields = <Disabled>{ fields }</Disabled>;
	}

	const sectionOpen = true;

	let customPosts = [
		{
			label: __( 'Portfolio Posts', 'wpzoom-portfolio' ),
			value: 'portfolio_item'
		},
		{
			label: __( 'Blog Posts', 'wpzoom-portfolio' ),
			value: 'post'
		}
	];

	if( undefined !== setting_options.wpzoom_pb_settings_custom_posts &&
		null !== setting_options.wpzoom_pb_settings_custom_posts &&
		0 !=  setting_options.wpzoom_pb_settings_custom_posts
	) {
		const transformedArray = setting_options.wpzoom_pb_settings_custom_posts.map( item => ({
			label: item.replace( '_', ' ' ).replace(/\b\w/g, firstLetter => firstLetter.toUpperCase() ),
			value: item,
		}));
		customPosts = [...customPosts, ...transformedArray];
	}

	return (
		<>
			<InspectorControls group="settings">
				{ 'portfolio_layout' == post_type && (
					<PanelBody icon={ shortcodeIcon } title={ __( 'Shortcode', 'wpzoom-portfolio' ) } initialOpen={ sectionOpen } className="wpzb-settings-panel">
						<p>{ __( 'To output this custom layout you can use the following shortcode:', 'wpzoom-portfolio' ) }</p>
						<p>
							{ __( 'Layout:', 'wpzoom-portfolio' ) }
							<br />
							<br />
							<code
								role="button"
								tabIndex="0"
								aria-hidden="true"
								onClick={ onShortcodeClick }
								onCopy={ onShortcodeCopy }
								onCut={ onShortcodeCopy }
							>
								[wpzoom_portfolio_layout id=&quot;
								{ post_id }
								&quot;]
							</code>
						</p>
					</PanelBody>
				)}
				<PanelBody icon={ filterIcon } title={ __( 'Filtering', 'wpzoom-portfolio' ) } initialOpen={ sectionOpen } className="wpzb-settings-panel">
						<SelectControl
							label={ __( 'Portfolio Items Source', 'wpzoom-portfolio' ) }
							value={ source }
							options={ customPosts }
							onChange={ ( value ) => setAttributes( { source: value, categories: [] } ) }
						/>

						<SelectControl
							label={ __( 'Order By', 'wpzoom-portfolio' ) }
							value={ `${ orderBy }/${ order }` }
							options={ [
								{
									label: __( 'Default', 'wpzoom-portfolio' ),
									value: 'menu_order date/desc'
								},
								{
									label: __( 'Newest to Oldest', 'wpzoom-portfolio' ),
									value: 'date/desc'
								},
								{
									label: __( 'Oldest to Newest', 'wpzoom-portfolio' ),
									value: 'date/asc'
								},
								{
									label: __( 'A → Z', 'wpzoom-portfolio' ),
									value: 'title/asc'
								},
								{
									label: __( 'Z → A', 'wpzoom-portfolio' ),
									value: 'title/desc'
								},
								{
									label: __( 'Random', 'wpzoom-portfolio' ),
									value: 'rand/desc'
								}
							] }
							onChange={ ( value ) => {
								const [ newOrderBy, newOrder ] = value.split( '/' );
								if ( newOrder !== order ) {
									setAttributes( { order: newOrder } );
								}
								if ( newOrderBy !== orderBy ) {
									setAttributes( { orderBy: newOrderBy } );
								}
							} }
						/>
						{ 'post' === source && (
						<TreeSelect
							label={ __( 'Categories', 'wpzoom-portfolio' ) }
							help={ __( 'Multiple selections allowed.', 'wpzoom-portfolio' ) }
							tree={ catTree }
							selectedId={ typeof categories !== 'undefined' && categories.length > 0 ? categories : [-1] }
							multiple
							onChange={ ( value ) => setAttributes( { categories: '' !== value ? value : undefined } ) }
						/>
						)}
						{ 'portfolio_item' === source && (
						<TreeSelect
							label={ __( 'Categories', 'wpzoom-portfolio' ) }
							help={ __( 'Multiple selections allowed.', 'wpzoom-portfolio' ) }
							tree={ termsTree }
							selectedId={ typeof categories !== 'undefined' && categories.length > 0 ? categories : [-1] }
							multiple
							onChange={ ( value ) => setAttributes( { categories: '' !== value ? value : undefined } ) }
						/>
						)}

						<RangeControl
							label={ __( 'Number of Items', 'wpzoom-portfolio' ) }
							value={ amount }
							onChange={ ( value ) => setAttributes( { amount: value } ) }
							min={ 1 }
							max={ 100 }
							required
						/>
						{ layout !== 'masonry' && ( 'portfolio_item' === source || 'post' === source ) &&
						<ToggleControl
							label={ __( 'Show Category Filter at the Top', 'wpzoom-portfolio' ) }
							checked={ showCategoryFilter }
							onChange={ ( value ) => setAttributes( { showCategoryFilter: value } ) }
						/>
						}
						{ ( 'portfolio_item' === source || 'post' === source ) && showCategoryFilter && <ToggleControl
							label={ __( 'Load Dynamically New Posts in Each Category', 'wpzoom-portfolio' ) }
							checked={ enableAjaxLoading }
							help={ __( 'This option will try to display the same number of posts in each category as it\'s configured in the Number of Posts option above.', 'wpzoom-portfolio' ) }
							onChange={ ( value ) => setAttributes( { enableAjaxLoading: value } ) }
						/>
						}
					</PanelBody>
					<PanelBody icon={ layoutIcon } title={ __( 'Layout', 'wpzoom-portfolio' ) } initialOpen={ sectionOpen } className="wpzb-settings-panel">
						<div className="wpzb-layout-options">
							<RadioControl
								className="wpzb-button-select wpzb-button-select-icons"
								label={ __( 'Layout Type', 'wpzoom-portfolio' ) }
								onChange={ ( value ) => setAttributes( { layout: value } ) }
								options={ [
									{ value: 'list',    label: __( 'Columns', 'wpzoom-portfolio' ) },
									{ value: 'grid',    label: __( 'Overlay', 'wpzoom-portfolio' ) },
									{ value: 'masonry', label: __( 'Masonry', 'wpzoom-portfolio' ) },
									{
										value: 'eccentric',
										label: (
											<div
												className="wpzb-layout-option-eccentric"
												onMouseEnter={ () => setShowEccentricTooltip( true ) }
												onMouseLeave={ () => setShowEccentricTooltip( false ) }
											>
												<span>{ __( 'Eccentric', 'wpzoom-portfolio' ) }</span>
												{ ! isPro && showEccentricTooltip && (
													<Popover
														className="wpzoom-preview-tooltip"
														position="top left"
														noArrow={ false }
														focusOnMount={ false }
														expandOnMobile={ true }
														animate={ true }
														offset={ 16 }
													>
														<img
															src={ plugin_url + "assets/images/eccentric-preview.jpg" }
															alt="Eccentric Layout Preview"
															style={{
																width: '100%',
																maxWidth: '400px',
																height: 'auto',
																borderRadius: '0'
															}}
														/>
													</Popover>
												) }
											</div>
										)
									}
								] }
								selected={ layout }
							/>
						</div>

						{ layout == 'eccentric' &&
							<ToggleControl
								label={ __( 'Dark Mode', 'wpzoom-portfolio' ) }
								help={ __( 'Invert colors for dark backgrounds.', 'wpzoom-portfolio' ) }
								checked={ eccentricDarkMode }
								onChange={ ( value ) => setAttributes( { eccentricDarkMode: value } ) }
							/>
						}

						{ layout == 'list' &&
							<RangeControl
								label={ __( 'Amount of Columns', 'wpzoom-portfolio' ) }
								max={ 4 }
								min={ 1 }
								onChange={ ( value ) => setAttributes( { columnsAmount: value } ) }
								value={ columnsAmount }
							/>
						}

						{ ( layout == 'grid' || layout == 'masonry' ) &&
							<RangeControl
								label={ __( 'Amount of Columns', 'wpzoom-portfolio' ) }
								max={ 6 }
								min={ 1 }
								onChange={ ( value ) => setAttributes( { columnsAmount: value } ) }
								value={ columnsAmount }
							/>
						}

						{ ( layout == 'grid' || layout == 'masonry' ) &&
							<RangeControl
								label={ __( 'Columns Gap', 'wpzoom-portfolio' ) }
								max={ 100 }
								min={ 0 }
								onChange={ ( value ) => setAttributes( { columnsGap: value } ) }
								value={ columnsGap }
							/>
						}

						{ ( layout == 'grid' || layout == 'masonry' ) &&
							<RangeControl
								label={ __( 'Item Border Radius', 'wpzoom-portfolio' ) }
								help={ __( 'Rounds the corners of portfolio items in the grid (overlay) and masonry layouts.', 'wpzoom-portfolio' ) }
								max={ 100 }
								min={ 0 }
								onChange={ ( value ) => setAttributes( { itemBorderRadius: value } ) }
								value={ itemBorderRadius }
							/>
						}

						<ToggleControl
							label={ __( 'Show View All Button', 'wpzoom-portfolio' ) }
							checked={ showViewAll }
							onChange={ ( value ) => setAttributes( { showViewAll: value } ) }
						/>

						{ showViewAll &&
							<TextControl
								label={ __( 'View All Button Label', 'wpzoom-portfolio' ) }
								value={ viewAllLabel }
								onChange={ ( value ) => setAttributes( { viewAllLabel: value } ) }
							/>
						}

						{ showViewAll &&
							<TextControl
								type="url"
								label={ __( 'View All Button Link', 'wpzoom-portfolio' ) }
								value={ viewAllLink }
								onChange={ ( value ) => setAttributes( { viewAllLink: value } ) }
							/>
						}
					</PanelBody>
					<PanelBody icon={ fieldsIcon } title={ __( 'Fields', 'wpzoom-portfolio' ) } initialOpen={ sectionOpen } className="wpzb-settings-panel">
						{ layout !== 'masonry' &&
							<ToggleControl
								label={ __( 'Show Thumbnail', 'wpzoom-portfolio' ) }
								checked={ showThumbnail }
								onChange={ ( value ) => setAttributes( { showThumbnail: value } ) }
							/>
						}
						{ showThumbnail && layout !== 'masonry' &&
							<SelectControl
								label={ __( 'Thumbnail Size', 'wpzoom-portfolio' ) }
								value={ thumbnailSize }
								options={ imageSizes }
								onChange={ ( value ) => setAttributes( { thumbnailSize: value } ) }
							/>
						}
						<HorizontalRule />
						{ ( layout == 'grid' || layout == 'masonry' ) && <ToggleControl
							label={ __( 'Show Title', 'wpzoom-portfolio' ) }
							checked={ showTitle }
							onChange={ ( value ) => setAttributes( { showTitle: value } ) }
						/> }
						{ ( layout == 'grid' || layout == 'masonry' ) && showTitle && <ToggleControl
							label={ __( 'Hide Title on Hover', 'wpzoom-portfolio' ) }
							help={ __( 'Reveal the clean image (or hover video) by fading the title overlay out on hover.', 'wpzoom-portfolio' ) }
							checked={ hideTitleOnHover }
							onChange={ ( value ) => setAttributes( { hideTitleOnHover: value } ) }
						/> }
						{ isPro && ( layout == 'grid' || layout == 'masonry' ) && <ToggleControl
							label={ __( 'Always Play Video Background', 'wpzoom-portfolio' ) }
							help={ __( 'Autoplay the hover-video on every item right away, instead of waiting for the visitor to hover. Mirrors the Inspiro theme’s portfolio behaviour. Requires items configured with a background video.', 'wpzoom-portfolio' ) }
							checked={ alwaysPlayBackgroundVideo }
							onChange={ ( value ) => setAttributes( { alwaysPlayBackgroundVideo: value } ) }
						/> }
						{ fields }
					</PanelBody>
					{ 'eccentric' !== layout &&
						<PanelBody icon={ settingsIcon } title={ __( 'Other Settings', 'wpzoom-portfolio' ) } initialOpen={ sectionOpen } className="wpzb-settings-panel">
							<ToggleControl
								label={ __( 'Open Portfolio Items in a Lightbox', 'wpzoom-portfolio' ) }
								checked={ lightbox }
								onChange={ ( value ) => setAttributes( { lightbox: value } ) }
							/>
							{ lightbox &&
								<ToggleControl
									label={ __( 'Show Lightbox Caption', 'wpzoom-portfolio' ) }
									checked={ lightboxCaption }
									onChange={ ( value ) => setAttributes( { lightboxCaption: value } ) }
								/>
							}
							{ ( 'grid' === layout || 'masonry' === layout ) &&
								<ToggleControl
									label={ __( 'Make Entire Item Clickable', 'wpzoom-portfolio' ) }
									help={ __( 'Link the whole item to the portfolio post, so a click anywhere on it opens the post. The lightbox icon still opens the lightbox.', 'wpzoom-portfolio' ) }
									checked={ entireItemClickable }
									onChange={ ( value ) => setAttributes( { entireItemClickable: value } ) }
								/>
							}
						</PanelBody>
					}
			</InspectorControls>
			<InspectorControls group="styles">
				<PanelBody title={ __( 'Filter', 'wpzoom-portfolio' ) } initialOpen={ false } className="wpzb-settings-panel">
					<PanelColorSettings
						title={ __( 'Colors', 'wpzoom-portfolio' ) }
						colorSettings={ [
							{
								value: secondaryColor,
								onChange: ( secondaryColor ) => setAttributes({ secondaryColor }),
								label: __( 'Default Color', 'wpzoom-portfolio' )
							},
							{
								value: primaryColor,
								onChange: ( primaryColor ) => setAttributes({ primaryColor }),
								label: __( 'Hover Color', 'wpzoom-portfolio' )
							},
							{
								value: filterActiveColor,
								onChange: ( filterActiveColor ) => setAttributes({ filterActiveColor }),
								label: __( 'Active Item Color', 'wpzoom-portfolio' )
							},
						] }
					/>
					<h2>{ __( 'Typography', 'wpzoom-portfolio') }</h2>
					<HorizontalRule />
					<RangeControl
						label={ __( 'Font Size', 'wpzoom-portfolio' )}
						value={ filterFontSize }
						onChange={ ( filterFontSize ) => setAttributes({ filterFontSize }) }
						min={ 12 }
						max={ 100 }
					/>
					<SelectControl
						label={ __( 'Font Family', 'wpzoom-portfolio' )}
						options={ fontFamilyOptions }
						value={ fontFamilies.includes( filterFontFamily ) ? filterFontFamily : 'Default' }
						onChange={ ( filterFontFamily ) => setAttributes({ filterFontFamily }) }
					/>
					<SelectControl
						label={ __( 'Font Weight', 'wpzoom-portfolio' )}
						options={ fontWeightOptions }
						value={ filterFontWeight }
						onChange={ ( filterFontWeight ) => setAttributes({ filterFontWeight }) }
					/>
					<SelectControl
						label={ __( 'Text Transform', 'wpzoom-portfolio' )}
						options={ textTransformOptions }
						value={ filterTextTransform }
						onChange={ ( filterTextTransform ) => setAttributes({ filterTextTransform }) }
					/>
					<RangeControl
						label={ __( 'Letter Spacing', 'wpzoom-portfolio' )}
						value={ filterLetterSpacing }
						onChange={ ( filterLetterSpacing ) => setAttributes({ filterLetterSpacing }) }
						min={ -2 }
						max={ 6 }
						step={ 0.1 }
					/>
					<h2>{ __( 'Alignment', 'wpzoom-portfolio') }</h2>
					<HorizontalRule />
					<AlignmentControl
						value={ filterAlignment }
						onChange={ ( nextAlign ) => setAttributes( { filterAlignment: nextAlign } ) }
					/>
				</PanelBody>
				{ ( layout == 'grid' || layout == 'masonry' ) &&
				<PanelBody title={ __( 'Layout', 'wpzoom-portfolio' ) } initialOpen={ false } className="wpzb-settings-panel">
					<RangeControl
						label={ __( 'Background Opacity (Normal)', 'wpzoom-portfolio' ) }
						help={ __( 'Only takes visible effect when "Show Title" is enabled — otherwise the overlay is hidden by default and only appears on hover.', 'wpzoom-portfolio' ) }
						value={ layoutBgOpacity }
						onChange={ ( value ) => setAttributes( { layoutBgOpacity: value } ) }
						step={ 0.1 }
						min={ 0 }
						max={ 1 }
					/>
					<RangeControl
						label={ __( 'Background Opacity (Hover)', 'wpzoom-portfolio' ) }
						value={ layoutBgOpacityHover }
						onChange={ ( value ) => setAttributes( { layoutBgOpacityHover: value } ) }
						step={ 0.1 }
						min={ 0 }
						max={ 1 }
					/>
				</PanelBody>
				}
				<PanelBody title={ __( 'Post Title', 'wpzoom-portfolio' ) } initialOpen={ false } className="wpzb-settings-panel">
					<PanelColorSettings
						title={ __( 'Colors', 'wpzoom-portfolio' ) }
						colorSettings={ [
							{
								value: postTitleColor,
								onChange: ( postTitleColor ) => setAttributes({ postTitleColor }),
								label: __( 'Default Color', 'wpzoom-portfolio' )
							},
							{
								value: postHoverTitleColor,
								onChange: ( postHoverTitleColor ) => setAttributes({ postHoverTitleColor }),
								label: __( 'Hover/Active Color', 'wpzoom-portfolio' )
							},
						] }
					/>
					<h2>{ __( 'Typography', 'wpzoom-portfolio') }</h2>
					<HorizontalRule />
					<RangeControl
						label={ __( 'Font Size', 'wpzoom-portfolio' )}
						value={ postTitleFontSize }
						onChange={ ( postTitleFontSize ) => setAttributes({ postTitleFontSize }) }
						min={ 12 }
						max={ 100 }
					/>
					<RangeControl
						label={ __( 'Font Size - Mobile Devices', 'wpzoom-portfolio' )}
						value={ postTitleFontSizeMobile }
						onChange={ ( postTitleFontSizeMobile ) => setAttributes({ postTitleFontSizeMobile }) }
						min={ 8 }
						max={ 100 }
						help={ __( 'Set Font size only for mobile devices', 'wpzoom-portfolio' ) }
					/>
					<SelectControl
						label={ __( 'Font Family', 'wpzoom-portfolio' )}
						options={ fontFamilyOptions }
						value={ fontFamilies.includes( postTitleFontFamily ) ? postTitleFontFamily : 'Default' }
						onChange={ ( postTitleFontFamily ) => setAttributes({ postTitleFontFamily }) }
					/>
					<SelectControl
						label={ __( 'Font Weight', 'wpzoom-portfolio' )}
						options={ fontWeightOptions }
						value={ postTitleFontWeight }
						onChange={ ( postTitleFontWeight ) => setAttributes({ postTitleFontWeight }) }
					/>
					<SelectControl
						label={ __( 'Text Transform', 'wpzoom-portfolio' )}
						options={ textTransformOptions }
						value={ postTitleTextTransform }
						onChange={ ( postTitleTextTransform ) => setAttributes({ postTitleTextTransform }) }
					/>
					<RangeControl
						label={ __( 'Letter Spacing', 'wpzoom-portfolio' )}
						value={ postTitleLetterSpacing }
						onChange={ ( postTitleLetterSpacing ) => setAttributes({ postTitleLetterSpacing }) }
						min={ -2 }
						max={ 6 }
						step={ 0.1 }
					/>
					<RangeControl
						label={ __( 'Line Height', 'wpzoom-portfolio' )}
						value={ postTitleLineHeight }
						onChange={ ( postTitleLineHeight ) => setAttributes({ postTitleLineHeight }) }
						min={ 0 }
						max={ 3 }
						step={ 0.1 }
					/>
				</PanelBody>

				<PanelBody initialOpen={ false } title={ __( 'Buttons', 'wpzoom-portfolio' ) } className="wpzb-settings-panel">
					<PanelColorSettings
						title={ __( 'Label Colors', 'wpzoom-portfolio' ) }
						colorSettings={ [
							{
								value: btnTextColor,
								onChange: ( btnTextColor ) => setAttributes({ btnTextColor }),
								label: __( 'Default Color', 'wpzoom-portfolio' )
							},
							{
								value: btnHoverTextColor,
								onChange: ( btnHoverTextColor ) => setAttributes( { btnHoverTextColor } ),
								label: __( 'Hover Color', 'wpzoom-portfolio' )
							},
						] }
					/>
					<PanelColorSettings
						title={ __( 'Background Colors', 'wpzoom-portfolio' ) }
						colorSettings={ [
							{
								value: btnBgColor,
								onChange: ( btnBgColor ) => setAttributes({ btnBgColor }),
								label: __( 'Default Color', 'wpzoom-portfolio' )
							},
							{
								value: btnHoverBgColor,
								onChange: ( btnHoverBgColor ) => setAttributes( { btnHoverBgColor } ),
								label: __( 'Hover Color', 'wpzoom-portfolio' )
							},
						] }
					/>
					<h2>{ __( 'Typography', 'wpzoom-portfolio') }</h2>
					<HorizontalRule />
					<RangeControl
						label={ __( 'Font Size', 'wpzoom-portfolio' )}
						value={ btnFontSize }
						onChange={ ( btnFontSize ) => setAttributes({ btnFontSize }) }
						min={ 12 }
						max={ 100 }
					/>
					<SelectControl
						label={ __( 'Font Family', 'wpzoom-portfolio' )}
						options={ fontFamilyOptions }
						value={ fontFamilies.includes( btnFontFamily ) ? btnFontFamily : 'Default' }
						onChange={ ( btnFontFamily ) => setAttributes({ btnFontFamily }) }
					/>
					<SelectControl
						label={ __( 'Text Transform', 'wpzoom-portfolio' )}
						options={ textTransformOptions }
						value={ btnTextTransform }
						onChange={ ( btnTextTransform ) => setAttributes({ btnTextTransform }) }
					/>
					<RangeControl
						label={ __( 'Letter Spacing', 'wpzoom-portfolio' )}
						value={ btnLetterSpacing }
						onChange={ ( btnLetterSpacing ) => setAttributes({ btnLetterSpacing }) }
						min={ -2 }
						max={ 6 }
						step={ 0.1 }
					/>
					<RangeControl
						label={ __( 'Border Radius', 'wpzoom-portfolio' ) }
						help={ __( 'Rounds the corners of the Load More and View All buttons.', 'wpzoom-portfolio' ) }
						value={ btnBorderRadius }
						onChange={ ( value ) => setAttributes( { btnBorderRadius: value } ) }
						min={ 0 }
						max={ 100 }
					/>
					<ToggleControl
						label={ __( 'Border?', 'wpzoom-portfolio' ) }
						checked={ btnBorder }
						onChange={ ( value ) => setAttributes( { btnBorder: value } ) }
					/>
					{ btnBorder &&
					<SelectControl
						label={ __( 'Border Style', 'wpzoom-portfolio' )}
						options={ borderStyleOptions }
						value={ btnBorderStyle }
						onChange={ ( btnBorderStyle ) => setAttributes({ btnBorderStyle }) }
					/> }
					{ btnBorder &&
					<RangeControl
						label={ __( 'Border Width', 'wpzoom-portfolio' ) }
						value={ btnBorderWidth }
						onChange={ ( value ) => setAttributes( { btnBorderWidth: value } ) }
						min={ 0 }
						max={ 10 }
						required
					/> }
					{ btnBorder &&
					<PanelColorSettings
						title={ __( 'Border Colors', 'wpzoom-portfolio' ) }
						colorSettings={ [
							{
								value: btnBorderColor,
								onChange: ( btnBorderColor ) => setAttributes({ btnBorderColor }),
								label: __( 'Default Color', 'wpzoom-portfolio' ),
								colors: blockColors
							},
							{
								value: btnHoverBorderColor,
								onChange: ( btnHoverBorderColor ) => setAttributes( { btnHoverBorderColor } ),
								label: __( 'Hover Color', 'wpzoom-portfolio' ),
								colors: secondaryColors
							},
						] }
					/>
					}
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<ServerSideRender block="wpzoom-blocks/portfolio" attributes={ attributes } />
			</div>
		</>
	);
}

registerBlockType( 'wpzoom-blocks/portfolio', {
	$schema: 'https://json.schemastore.org/block.json',
	apiVersion: 3,
	title: __( 'Portfolio', 'wpzoom-portfolio' ),
	description: __( 'Display a customizable grid of portfolio items.', 'wpzoom-portfolio' ),
	icon: 'layout',
	category: 'wpzoom-blocks',
	supports: {
		align: true,
		html: false,
		color: {
			text: true,
			background: false,
			link: true
		},
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontFamily: true,
			__experimentalFontWeight: true,
			__experimentalFontStyle: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalLetterSpacing: true,
			__experimentalDefaultControls: {
				FontFamily: true,
			}
		},
		__experimentalSelector: '.wpzoom-blocks_portfolio-block_filter .wpz-portfolio-filter__link'
	},
	example: {},
	edit: PortfolioEdit,
} );
