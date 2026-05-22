import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { Disabled, PanelBody, Placeholder } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
const { serverSideRender: ServerSideRender } = wp;

import ReactSelect from 'react-select';

function getPostEditURL( layoutId ) {
	return addQueryArgs( 'post.php', {
		post: layoutId,
		action: 'edit'
	} );
}

function PortfolioLayoutsEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const { layoutId } = attributes;
	const _layoutId = layoutId && String( layoutId ).trim() !== '' ? String( layoutId ) : '-1';

	const posts = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords( 'postType', 'portfolio_layout', { order: 'desc', orderby: 'date', per_page: -1 } );
	} );

	const recipeReactSelectPosts = posts && posts.length > 0
		? posts.map( ( x ) => ( { value: x.id, label: x.title.raw } ) )
		: [];

	const postReactSelect = (
		<ReactSelect
			className="wpzoom-select-portfolio-layouts"
			aria-labelledby="layouts-select"
			options={ recipeReactSelectPosts }
			value={ _layoutId }
			onChange={ ( value ) => setAttributes( { layoutId: String( value ) } ) }
			simpleValue
			clearable={ true }
		/>
	);

	const getCPTEditURL = getPostEditURL( _layoutId );
	const editCPT = (
		<p className="wpzoom-edit-link-description">
			{ __( 'Edit the layout', 'wpzoom-portfolio' ) }{ ' ' }
			<a href={ getCPTEditURL }>{ __( 'here', 'wpzoom-portfolio' ) }</a>
		</p>
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Options', 'wpzoom-portfolio' ) }>
					{ recipeReactSelectPosts.length > 0 ? postReactSelect : <Disabled>{ postReactSelect }</Disabled> }
					{ editCPT }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '-1' !== _layoutId ?
					<ServerSideRender block="wpzoom-blocks/portfolio-layouts" attributes={ attributes } /> :
					<Placeholder label={ __( 'Portfolio Layout', 'wpzoom-portfolio' ) }>
						{ recipeReactSelectPosts.length > 0 ? postReactSelect : <Disabled>{ postReactSelect }</Disabled> }
					</Placeholder>
				}
			</div>
		</>
	);
}

registerBlockType( 'wpzoom-blocks/portfolio-layouts', {
	$schema: 'https://json.schemastore.org/block.json',
	apiVersion: 3,
	title:       __( 'Portfolio Layouts', 'wpzoom-portfolio' ),
	description: __( 'Select and display one of your portfolio layouts', 'wpzoom-portfolio' ),
	icon:        'layout',
	category:    'wpzoom-blocks',
	supports:    { align: true, html: false },
	attributes:  {
		layoutId: {
			type:    'string',
			default: '-1'
		}
	},
	example:     {},
	edit:        PortfolioLayoutsEdit,
} );
