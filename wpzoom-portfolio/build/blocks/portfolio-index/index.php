<?php
/**
 * WPZOOM Portfolio Index - Custom Gutenberg blocks designed by WPZOOM.
 *
 * @package   WPZOOM_Blocks
 * @author    WPZOOM
 * @copyright 2026 WPZOOM
 * @license   GPL-2.0-or-later
 */

// Exit if accessed directly
defined( 'ABSPATH' ) || exit;

/**
 * Class WPZOOM_Blocks_Portfolio_Index
 *
 * A numbered list of portfolio projects with a project panel beside it:
 * hovering a title previews the project (its hover video plays in the panel),
 * the preview stays while the cursor moves to the panel, and the play button plays the project's video.
 * Same markup and behaviour as the "Portfolio Index" Elementor widget in
 * WPZOOM Elementor Addons, so both share one look.
 *
 * @since 1.4.0
 */
class WPZOOM_Blocks_Portfolio_Index {

	/**
	 * Attributes for the block, used in the Gutenberg editor.
	 *
	 * @var    array
	 * @access public
	 */
	public $attributes = array(
		'align'          => array( 'type' => 'string', 'default' => '' ),
		'className'      => array( 'type' => 'string', 'default' => '' ),
		'category'       => array( 'type' => 'string', 'default' => '' ),
		'amount'         => array( 'type' => 'number', 'default' => 12 ),
		'order'          => array( 'type' => 'string', 'default' => 'date' ),
		'listLabel'      => array( 'type' => 'string', 'default' => 'Latest projects' ),
		'showNumbers'    => array( 'type' => 'boolean', 'default' => true ),
		'showRail'       => array( 'type' => 'boolean', 'default' => true ),
		'italicActive'   => array( 'type' => 'boolean', 'default' => true ),
		'clickAction'    => array( 'type' => 'string', 'default' => 'panel' ),
		'openFirst'      => array( 'type' => 'boolean', 'default' => true ),
		'previewVideo'   => array( 'type' => 'boolean', 'default' => true ),
		'mediaRatio'     => array( 'type' => 'string', 'default' => '16/9' ),
		'mediaRadius'    => array( 'type' => 'number', 'default' => 0 ),
		'showYear'       => array( 'type' => 'boolean', 'default' => true ),
		'showDetails'    => array( 'type' => 'boolean', 'default' => true ),
		'showExcerpt'    => array( 'type' => 'boolean', 'default' => true ),
		'moreText'       => array( 'type' => 'string', 'default' => 'Open project' ),
		'listWidth'      => array( 'type' => 'number', 'default' => 36 ),
		'columnGap'      => array( 'type' => 'number', 'default' => 80 ),
		'stickyTop'      => array( 'type' => 'number', 'default' => 120 ),
		'titleSize'      => array( 'type' => 'number', 'default' => 32 ),
		'panelTitleSize' => array( 'type' => 'number', 'default' => 34 ),
		'itemGap'        => array( 'type' => 'number', 'default' => 14 ),
		'textColor'      => array( 'type' => 'string', 'default' => '' ),
	);

	/**
	 * Basic class initialization.
	 *
	 * @access public
	 * @return void
	 */
	public function __construct() {}

	/**
	 * The project's hover video, if it has one: the Inspiro "Video Background on
	 * Hover" (self-hosted) or the plugin's own self-hosted video.
	 *
	 * @param  int $post_id Portfolio post ID.
	 * @return string
	 */
	protected function get_preview_video( $post_id ) {
		if ( function_exists( 'init_video_background_on_hover_module' ) ) {
			$url = init_video_background_on_hover_module()->get_data( $post_id );
			if ( $url && preg_match( '/\.(mp4|webm|mov)(\?|$)/i', $url ) ) {
				return $url;
			}
		}

		$url = get_post_meta( $post_id, 'wpzoom_portfolio_video_background_mp4', true );
		if ( $url ) {
			return $url;
		}

		if ( 'service' !== get_post_meta( $post_id, '_wpzb_portfolio_video_type', true ) ) {
			$file = wp_get_attachment_url( intval( get_post_meta( $post_id, '_wpzb_portfolio_video_id', true ) ) );
			if ( $file ) {
				return $file;
			}
		}

		return '';
	}

	/**
	 * Player markup for the project's video: a self-hosted file or a YouTube /
	 * Vimeo embed. Printed inside a <template> so nothing loads until play.
	 *
	 * @param  int $post_id Portfolio post ID.
	 * @return string
	 */
	protected function get_player( $post_id ) {
		$type = get_post_meta( $post_id, 'wpzoom_portfolio_popup_video_type', true );
		$file = get_post_meta( $post_id, 'wpzoom_portfolio_video_popup_url_mp4', true );
		$url  = get_post_meta( $post_id, 'wpzoom_portfolio_video_popup_url', true );

		// The plugin's own video field, when the theme's lightbox fields are empty.
		if ( ! $file && ! $url ) {
			if ( 'service' === get_post_meta( $post_id, '_wpzb_portfolio_video_type', true ) ) {
				$url = trim( get_post_meta( $post_id, '_wpzb_portfolio_video_url', true ) );
			} else {
				$file = wp_get_attachment_url( intval( get_post_meta( $post_id, '_wpzb_portfolio_video_id', true ) ) );
			}
		}

		if ( $file && ( 'self_hosted' === $type || ! $url ) ) {
			// wp-video-shortcode: the frontend script hands the element to WordPress's
			// MediaElement player, which the theme's Video Player Style skins.
			if ( ! function_exists( 'wpzoom_portfolio_use_mediaelement_player' ) || ! wpzoom_portfolio_use_mediaelement_player() ) {
				return sprintf( '<video src="%s" controls playsinline preload="none"></video>', esc_url( $file ) );
			}
			wp_enqueue_style( 'wp-mediaelement' );
			wp_enqueue_script( 'wp-mediaelement' );
			return sprintf( '<video class="wp-video-shortcode" src="%s" controls playsinline preload="none"></video>', esc_url( $file ) );
		}

		if ( $url ) {
			global $wp_embed;
			$html = ( $wp_embed instanceof WP_Embed ) ? $wp_embed->shortcode( array( 'width' => 1600 ), $url ) : '';

			if ( $html && false !== stripos( $html, '<iframe' ) ) {
				return preg_replace_callback(
					'/src="([^"]+)"/',
					function ( $m ) {
						return 'src="' . esc_url( add_query_arg( array( 'autoplay' => 1 ), html_entity_decode( $m[1] ) ) ) . '" allow="autoplay; fullscreen; picture-in-picture"';
					},
					$html,
					1
				);
			}
		}

		return '';
	}

	/**
	 * Renders the block contents on the frontend.
	 *
	 * @access public
	 * @param  array  $attributes Block attributes.
	 * @param  string $content    Block content.
	 * @return string
	 */
	public function render( $attributes, $content ) {
		$a = wp_parse_args( $attributes, wp_list_pluck( $this->attributes, 'default' ) );

		if ( ! post_type_exists( 'portfolio_item' ) ) {
			return '';
		}

		$orderby = in_array( $a['order'], array( 'date', 'menu_order', 'title' ), true ) ? $a['order'] : 'date';
		$args    = array(
			'post_type'           => 'portfolio_item',
			'posts_per_page'      => max( 1, (int) $a['amount'] ),
			'orderby'             => $orderby,
			'order'               => 'date' === $orderby ? 'DESC' : 'ASC',
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		);
		if ( ! empty( $a['category'] ) ) {
			$args['tax_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
				array(
					'taxonomy' => 'portfolio',
					'field'    => 'slug',
					'terms'    => $a['category'],
				),
			);
		}

		$query = new WP_Query( $args );
		if ( ! $query->have_posts() ) {
			return current_user_can( 'edit_posts' ) ? '<p>' . esc_html__( 'No portfolio projects found.', 'wpzoom-portfolio' ) . '</p>' : '';
		}

		$classes = array( 'wpz-pindex' );
		if ( $a['showRail'] ) {
			$classes[] = 'wpz-pindex--rail';
		}
		if ( $a['italicActive'] ) {
			$classes[] = 'wpz-pindex--italic';
		}

		$vars = sprintf(
			'--wpz-pindex-list:%d%%;--wpz-pindex-gap:%dpx;--wpz-pindex-top:%dpx;--wpz-pindex-item-gap:%dpx;--wpz-pindex-title:%dpx;--wpz-pindex-panel-title:%dpx;',
			max( 20, min( 70, (int) $a['listWidth'] ) ),
			max( 0, (int) $a['columnGap'] ),
			max( 0, (int) $a['stickyTop'] ),
			max( 0, (int) $a['itemGap'] ),
			max( 12, (int) $a['titleSize'] ),
			max( 12, (int) $a['panelTitleSize'] )
		);
		$vars .= '--wpz-pindex-radius:' . max( 0, (int) $a['mediaRadius'] ) . 'px;';
		if ( $a['textColor'] ) {
			$vars .= 'color:' . sanitize_hex_color( $a['textColor'] ) . ';--wpz-pindex-rail:' . sanitize_hex_color( $a['textColor'] ) . ';';
		}

		$items  = '';
		$panels = '';
		$i      = 0;

		while ( $query->have_posts() ) {
			$query->the_post();
			$post_id  = get_the_ID();
			$active   = ( $a['openFirst'] && 0 === $i ) ? ' is-active' : '';
			$title    = get_the_title();
			$link     = get_permalink();
			$year     = get_post_meta( $post_id, 'su_portfolio_item_year', true );
			$director = get_post_meta( $post_id, 'su_portfolio_item_director', true );
			$client   = get_post_meta( $post_id, 'su_portfolio_item_client', true );
			$preview  = $a['previewVideo'] ? $this->get_preview_video( $post_id ) : '';
			$player   = $this->get_player( $post_id );
			$poster   = get_the_post_thumbnail_url( $post_id, 'large' );

			$items .= sprintf(
				'<li class="wpz-pindex__item%1$s" data-index="%2$d"><a class="wpz-pindex__link" href="%3$s">%4$s<span class="wpz-pindex__title">%5$s</span></a></li>',
				esc_attr( $active ),
				(int) $i,
				esc_url( $link ),
				$a['showNumbers'] ? '<span class="wpz-pindex__num">' . esc_html( str_pad( (string) ( $i + 1 ), 2, '0', STR_PAD_LEFT ) ) . '</span>' : '',
				esc_html( $title )
			);

			$media = '';
			if ( $poster ) {
				$media .= sprintf( '<img class="wpz-pindex__poster" src="%s" alt="" loading="lazy" decoding="async">', esc_url( $poster ) );
			}
			if ( $preview ) {
				$media .= sprintf( '<video class="wpz-pindex__preview" data-src="%s" muted loop playsinline preload="none" aria-hidden="true"></video>', esc_url( $preview ) );
			}
			if ( $player ) {
				$media .= sprintf(
					'<button type="button" class="wpz-pindex__play" aria-label="%s"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg></button><template class="wpz-pindex__player">%s</template>',
					/* translators: %s: project title. */
					esc_attr( sprintf( __( 'Play %s', 'wpzoom-portfolio' ), $title ) ),
					$player // Escaped in get_player() / by WP_Embed.
				);
			}

			$details = '';
			if ( $a['showDetails'] ) {
				if ( $director ) {
					$details .= '<div><dt>' . esc_html__( 'Director', 'wpzoom-portfolio' ) . '</dt><dd>' . esc_html( $director ) . '</dd></div>';
				}
				if ( $client ) {
					$details .= '<div><dt>' . esc_html__( 'Client', 'wpzoom-portfolio' ) . '</dt><dd>' . esc_html( $client ) . '</dd></div>';
				}
			}

			$panels .= sprintf(
				'<article class="wpz-pindex__panel%1$s" data-index="%2$d"%3$s><header class="wpz-pindex__head"><h2 class="wpz-pindex__panel-title">%4$s</h2>%5$s</header><div class="wpz-pindex__media" style="aspect-ratio:%6$s">%7$s</div>%8$s%9$s%10$s</article>',
				esc_attr( $active ),
				(int) $i,
				$active ? '' : ' aria-hidden="true"',
				esc_html( $title ),
				( $a['showYear'] && $year ) ? '<span class="wpz-pindex__year">' . esc_html( $year ) . '</span>' : '',
				esc_attr( in_array( $a['mediaRatio'], array( '16/9', '2.39/1', '4/3', '1/1' ), true ) ? $a['mediaRatio'] : '16/9' ),
				$media,
				$details ? '<dl class="wpz-pindex__details">' . $details . '</dl>' : '',
				( $a['showExcerpt'] && has_excerpt() ) ? '<div class="wpz-pindex__text">' . wp_kses_post( wpautop( get_the_excerpt() ) ) . '</div>' : '',
				$a['moreText'] ? '<a class="wpz-pindex__more" href="' . esc_url( $link ) . '">' . esc_html( $a['moreText'] ) . ' <span aria-hidden="true">&rarr;</span></a>' : ''
			);

			$i++;
		}
		wp_reset_postdata();

		$wrapper = function_exists( 'get_block_wrapper_attributes' )
			? get_block_wrapper_attributes( array( 'class' => 'wpzoom-blocks_portfolio-index-block' ) )
			: 'class="wpzoom-blocks_portfolio-index-block"';

		return sprintf(
			'<div %1$s><div class="%2$s" style="%7$s" data-click="%3$s"><div class="wpz-pindex__list">%4$s<ol class="wpz-pindex__items">%5$s</ol></div><div class="wpz-pindex__stage">%6$s</div></div></div>',
			$wrapper,
			esc_attr( implode( ' ', $classes ) ),
			esc_attr( 'post' === $a['clickAction'] ? 'post' : 'panel' ),
			$a['listLabel'] ? '<p class="wpz-pindex__label">' . esc_html( $a['listLabel'] ) . '</p>' : '',
			$items, // Built from escaped parts above.
			$panels, // Built from escaped parts above.
			esc_attr( $vars )
		);
	}
}
