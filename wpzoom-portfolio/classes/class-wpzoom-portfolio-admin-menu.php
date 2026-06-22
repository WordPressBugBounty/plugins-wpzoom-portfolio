<?php
/**
 * Register admin menu elements.
 *
 * @since   1.0.5
 * @package WPZOOM_Portfolio
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class for admin menu.
 */
class WPZOOM_Portfolio_Admin_Menu {

	/**
	 * Go Pro link.
	 *
	 * @var string
	 */
	private static $goProLink = 'https://www.wpzoom.com/plugins/portfolio-pro/?utm_source=wpadmin&utm_medium=portfolio-free&utm_campaign=go-pro-links';

	/**
	 * The Constructor.
	 */
	public function __construct() {

		// Let's add menu item with subitems
		add_action( 'admin_menu', array( $this, 'register_menus' ), 15 );
		add_action( 'plugin_action_links_' . WPZOOM_PORTFOLIO_PLUGIN_BASE, array( $this, 'plugin_action_links' ) );
		
		add_action( 'admin_menu', array( $this, 'plugin_add_go_pro_link_to_menu' ), 15 );

		add_action( 'admin_head', array( $this, 'add_css_go_pro_menu' ) );
		add_action( 'admin_footer', array( $this, 'add_target_blank_go_pro_menu' ) );

	}

	/**
	 * Add settings and go PRO link to plugin page.
	 *
	 * @param array $links Array of links.
	 * @return array
	 */
	public function plugin_action_links( $links ) {

		// Settings link
		$settings_link = '<a href="' . admin_url( 'edit.php?post_type=portfolio_item&page=wpzoom-portfolio-settings' ) . '">' . esc_html__( 'Settings', 'wpzoom-portfolio' ) . '</a>';

		// Add settings link to the array
		array_unshift( $links, $settings_link );

		// Add Go Pro link if the plugin is not active
		if( ! defined( 'WPZOOM_PORTFOLIO_PRO_VERSION' ) && ! wpzoom_theme_has_portfolio() ) {
			$links['go_pro'] = sprintf( 
				'<a href="%1$s" target="_blank" class="wpzoom-portfolio-gopro" style="color:#0BB4AA;font-weight:bold;">UPGRADE &rarr; <span class="rcb-premium-badge" style="background-color: #0BB4AA; color: #fff; margin-left: 5px; font-size: 11px; min-height: 16px;  border-radius: 8px; display: inline-block; font-weight: 600; line-height: 1.6; padding: 0 8px">%2$s</span></a>',
				self::$goProLink, 
				esc_html__( 'PRO', 'wpzoom-portfolio' )
			);
		}

		return $links;

	}

	// Add Go Pro link to the Portfolio menu
	public function plugin_add_go_pro_link_to_menu() {
		global $submenu;

		// Add Go Pro link to the Portfolio menu
		if( ! defined( 'WPZOOM_PORTFOLIO_PRO_VERSION' ) && ! wpzoom_theme_has_portfolio() ) {
			$submenu['edit.php?post_type=portfolio_item'][] = array( 
				'' . esc_html__( 'UPGRADE &rarr;', 'wpzoom-portfolio' ) . '',
				'manage_options', 
				self::$goProLink 
			);
		}
	}

	/**
	 * Register admin menus.
	 */
	public function register_menus() {
		
		$page_title = esc_html__( 'WPZOOM Portfolio Settings Page', 'wpzoom-portfolio' );

        // Remove Add New submenu item.
        // remove_submenu_page( 'edit.php?post_type=portfolio_item', 'post-new.php?post_type=portfolio_item' );

		//WPZOOM Portfolio sub menu item.
		add_submenu_page(
			'edit.php?post_type=portfolio_item',
			$page_title,
			esc_html__( 'Settings', 'wpzoom-portfolio' ),
			'manage_options',
			'wpzoom-portfolio-settings',
			array( $this, 'admin_page' ),
			5
		);

		// Photo Proofing upsell. Only when PRO is not active — when PRO is
		// active it registers the real Proofing Galleries submenu in this slot.
		// Note: no theme check here. Photo Proofing isn't bundled in any WPZOOM
		// theme, so the upsell should show even on those themes.
		if ( ! defined( 'WPZOOM_PORTFOLIO_PRO_VERSION' ) ) {
			add_submenu_page(
				'edit.php?post_type=portfolio_item',
				esc_html__( 'Photo Proofing', 'wpzoom-portfolio' ),
				esc_html__( 'Photo Proofing', 'wpzoom-portfolio' ),
				'manage_options',
				'upsell',
				array( $this, 'proofing_upsell_page' )
			);
		}

	}

	/**
	 * Render the Photo Proofing upsell page (free version only).
	 *
	 * @since 1.4.28
	 */
	public function proofing_upsell_page() {
		$pro_url   = 'https://www.wpzoom.com/plugins/portfolio-pro/?utm_source=wpadmin&utm_medium=portfolio-free&utm_campaign=proofing-upsell';
		$image_url = WPZOOM_PORTFOLIO_URL . 'assets/images/photo-proofing.png';

		$steps = array(
			array(
				'title' => esc_html__( 'Create a gallery', 'wpzoom-portfolio' ),
				'text'  => esc_html__( 'Upload your photos and publish a private proofing gallery in just a few seconds.', 'wpzoom-portfolio' ),
			),
			array(
				'title' => esc_html__( 'Share the secret link', 'wpzoom-portfolio' ),
				'text'  => esc_html__( 'Send your client a unique, unguessable link — no account or login required on their end.', 'wpzoom-portfolio' ),
			),
			array(
				'title' => esc_html__( 'Get their approval', 'wpzoom-portfolio' ),
				'text'  => esc_html__( 'Your client marks their favorites and approves. You get an instant email with the final selection.', 'wpzoom-portfolio' ),
			),
		);
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Photo Proofing', 'wpzoom-portfolio' ); ?></h1>

			<div class="wpzoom-portfolio-proofing-upsell">

				<div class="wpzoom-proofing-upsell-hero">
					<div class="wpzoom-proofing-upsell-header">
						<h2>
							<?php esc_html_e( 'Unlock Photo Proofing with WPZOOM Portfolio PRO', 'wpzoom-portfolio' ); ?>
							<span class="wpzoom-proofing-pro-badge"><?php esc_html_e( 'PRO', 'wpzoom-portfolio' ); ?></span>
						</h2>

						<p class="wpzoom-proofing-upsell-lead"><?php esc_html_e( 'Create private proofing galleries, share them with clients through a secret link, and collect their photo selections for approval — all from your WordPress dashboard.', 'wpzoom-portfolio' ); ?></p>

						<p>
							<a href="<?php echo esc_url( $pro_url ); ?>" target="_blank" class="button button-primary button-hero"><?php esc_html_e( 'Upgrade to PRO', 'wpzoom-portfolio' ); ?></a>
						</p>
					</div>

					<div class="wpzoom-proofing-upsell-image">
						<img src="<?php echo esc_url( $image_url ); ?>" alt="<?php esc_attr_e( 'Photo Proofing preview', 'wpzoom-portfolio' ); ?>" />
					</div>
				</div>

				<div class="wpzoom-proofing-steps">
					<?php foreach ( $steps as $index => $step ) : ?>
						<div class="wpzoom-proofing-step">
							<div class="wpzoom-proofing-step-head">
								<span class="wpzoom-proofing-step-number"><?php echo esc_html( $index + 1 ); ?></span>
								<span class="wpzoom-proofing-step-line"></span>
							</div>
							<h3 class="wpzoom-proofing-step-title"><?php echo esc_html( $step['title'] ); ?></h3>
							<p class="wpzoom-proofing-step-text"><?php echo esc_html( $step['text'] ); ?></p>
						</div>
					<?php endforeach; ?>
				</div>

			</div>
		</div>

		<style>
			/* Make the whole admin page white, not just the upsell box. */
			#wpcontent, #wpbody-content { background-color: #fff; }
			.wpzoom-portfolio-proofing-upsell {
				max-width: 1080px;
				margin: 30px auto 0;
			}
			.wpzoom-proofing-upsell-hero {
				display: flex;
				align-items: center;
				gap: 40px;
			}
			.wpzoom-proofing-upsell-header { flex: 1 1 40%; }
			.wpzoom-portfolio-proofing-upsell h2 { 
				font-size: 22px; 
				margin-top: 0;
				line-height: 1.4;
			}
			.wpzoom-proofing-pro-badge {
				background-color: #3858e9;
				color: #fff;
				font-size: 12px;
				border-radius: 4px;
				padding: 4px 8px;
				vertical-align: middle;
				font-weight: 600;
				margin-left: 6px;
			}
			.wpzoom-proofing-upsell-lead { font-size: 15px; max-width: 640px; }
			.wpzoom-proofing-upsell-image {
				flex: 1 1 60%;
			}
			.wpzoom-proofing-upsell-image img {
				display: block;
				width: 100%;
				height: auto;
				border-radius: 6px;
				border: 1px solid #e2e4e7;
			}
			.wpzoom-proofing-steps {
				display: flex;
				gap: 40px;
				margin-top: 100px;
			}
			.wpzoom-proofing-step { flex: 1; }
			.wpzoom-proofing-step-head {
				display: flex;
				align-items: center;
				margin-bottom: 18px;
			}
			.wpzoom-proofing-step-number {
				flex: 0 0 auto;
				width: 44px;
				height: 44px;
				border-radius: 50%;
				background-color: #1a1a1a;
				color: #fff;
				font-size: 16px;
				font-weight: 700;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.wpzoom-proofing-step-line {
				flex: 1 1 auto;
				height: 1px;
				background-color: #e2e4e7;
				margin-left: 16px;
			}
			.wpzoom-proofing-step-title {
				font-size: 18px;
				font-weight: 700;
				margin: 0 0 10px;
			}
			.wpzoom-proofing-step-text {
				font-size: 14px;
				color: #50575e;
				margin: 0;
			}
			@media screen and (max-width: 782px) {
				.wpzoom-proofing-upsell-hero { flex-direction: column; align-items: stretch; }
				.wpzoom-proofing-steps { flex-direction: column; gap: 30px; }
			}
		</style>
		<?php
	}

	/**
	 * Wrapper for the hook to render our custom settings pages.
	 *
	 * @since 1.0.5
	 */
	public function admin_page() {
		do_action( 'wpzoom_portfolio_admin_page' );
	}

	/**
	 * Add CSS to Go Pro link.
	 */
	public function add_css_go_pro_menu() {
		?>
		<style>
			#adminmenu #menu-posts-portfolio_item a[href="<?php echo self::$goProLink; ?>"] {
				color: #0BB4AA;
				font-weight: bold;
			}
		</style>
		<?php
	}

	/**
	 * Add target="_blank" to Go Pro link.
	 */
	public function add_target_blank_go_pro_menu() {
		?>
		<script>
			jQuery( document ).ready( function( $ ) {
				$('a[href$="<?php echo self::$goProLink; ?>"]').attr('target', '_blank');				
			});
		</script>
		<?php
	}

}

new WPZOOM_Portfolio_Admin_Menu();