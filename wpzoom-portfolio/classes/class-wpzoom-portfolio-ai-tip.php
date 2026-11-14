<?php
/**
 * A tip on the Portfolio items list: add and edit portfolio items by chatting with Claude or ChatGPT through the free
 * WPZOOM AI Connect plugin. Shown only on that screen, to people who can manage the site, on WordPress 6.9+ (where AI Connect runs),
 * until they hide it.
 *
 * @package WPZOOM_Portfolio
 * @since   1.4.38
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WPZOOM_Portfolio_AI_Tip {

	const SCREEN      = 'edit-portfolio_item';
	const HIDDEN_META = 'wpzoom_portfolio_ai_tip_hidden';
	const PLUGIN_FILE = 'wpzoom-ai-connect/wpzoom-ai-connect.php';

	public static function init() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'styles' ), 110 );
		add_action( 'all_admin_notices', array( __CLASS__, 'render' ), 20 );
		add_action( 'admin_post_wpzoom_portfolio_hide_ai_tip', array( __CLASS__, 'hide' ) );
	}

	/** Whether to show the tip on the current screen. */
	private static function visible() {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		return $screen && self::SCREEN === $screen->id
			&& function_exists( 'wp_register_ability' )
			&& current_user_can( 'manage_options' )
			&& ! get_user_meta( get_current_user_id(), self::HIDDEN_META, true );
	}

	/** Install, activate or open AI Connect, depending on its state; null when the user can do none of them. */
	private static function action() {
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		if ( is_plugin_active( self::PLUGIN_FILE ) ) {
			return array( __( 'Open AI Connect', 'wpzoom-portfolio' ), add_query_arg( array( 'page' => 'wpzoom-ai-connect', 'ref' => 'wpzoom-portfolio' ), admin_url( 'admin.php' ) ) );
		}
		if ( file_exists( WP_PLUGIN_DIR . '/' . self::PLUGIN_FILE ) ) {
			return current_user_can( 'activate_plugin', self::PLUGIN_FILE )
				? array( __( 'Activate AI Connect', 'wpzoom-portfolio' ), wp_nonce_url( admin_url( 'plugins.php?action=activate&plugin=' . rawurlencode( self::PLUGIN_FILE ) ), 'activate-plugin_' . self::PLUGIN_FILE ) )
				: null;
		}
		return current_user_can( 'install_plugins' )
			? array( __( 'Install AI Connect', 'wpzoom-portfolio' ), admin_url( 'plugin-install.php?s=wpzoom%2520ai%2520connect&tab=search&type=term' ) )
			: null;
	}

	public static function styles() {
		if ( ! self::visible() ) {
			return;
		}
		$css = '.wpzoom-portfolio-ai-tip{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:16px 20px 0 2px;padding:14px 18px;background:#f0f7ff;border:1px solid #c5ddfa;border-radius:6px}'
			. '.wpzoom-portfolio-ai-tip__icon{flex:0 0 auto;color:#3496fe}'
			. '.wpzoom-portfolio-ai-tip__text{flex:1 1 320px;margin:0;font-size:13px;line-height:1.6;color:#242628}'
			. '.wpzoom-portfolio-ai-tip__text em{font-style:normal;font-weight:600}'
			. '.wpzoom-portfolio-ai-tip__actions{display:flex;align-items:center;gap:14px;flex:0 0 auto}'
			. '.wpzoom-portfolio-ai-tip__actions a.wpzoom-portfolio-ai-tip__hide{color:#646970;text-decoration:none}'
			. '.wpzoom-portfolio-ai-tip__actions a.wpzoom-portfolio-ai-tip__hide:hover{color:#1d2327}';
		wp_register_style( 'wpzoom-portfolio-ai-tip', false, array(), WPZOOM_PORTFOLIO_VERSION );
		wp_enqueue_style( 'wpzoom-portfolio-ai-tip' );
		wp_add_inline_style( 'wpzoom-portfolio-ai-tip', $css );
	}

	public static function render() {
		if ( ! self::visible() ) {
			return;
		}
		$action   = self::action();
		$hide_url = wp_nonce_url( add_query_arg( 'action', 'wpzoom_portfolio_hide_ai_tip', admin_url( 'admin-post.php' ) ), 'wpzoom_portfolio_hide_ai_tip' );
		?>
		<div class="wpzoom-portfolio-ai-tip" role="note">
			<svg class="wpzoom-portfolio-ai-tip__icon" width="22" height="22" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M3.98359 8.70108L5.58302 9.30884C6.78512 9.76562 7.73437 10.7149 8.19115 11.917L8.7989 13.5164C8.90953 13.8075 9.18856 14 9.49999 14C9.81143 14 10.0905 13.8075 10.2011 13.5164L10.8088 11.917C11.2656 10.7149 12.2149 9.76562 13.417 9.30884L15.0164 8.70108C15.3075 8.59046 15.5 8.31143 15.5 7.99999C15.5 7.68856 15.3075 7.40953 15.0164 7.2989L13.417 6.69115C12.2149 6.23437 11.2656 5.28512 10.8088 4.08302L10.2011 2.48359C10.0905 2.19247 9.81143 2 9.49999 2C9.18856 2 8.90953 2.19247 8.7989 2.48359L8.19115 4.08302C7.73437 5.28512 6.78513 6.23437 5.58302 6.69115L3.98359 7.2989C3.69247 7.40953 3.5 7.68856 3.5 7.99999C3.5 8.31143 3.69247 8.59046 3.98359 8.70108Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M3.5 14.75V11.75M2 13.25H5M2.75 4.25V1.25M1.25 2.75H4.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			<p class="wpzoom-portfolio-ai-tip__text">
				<strong><?php esc_html_e( 'Add portfolio items by chatting with AI.', 'wpzoom-portfolio' ); ?></strong>
				<?php
				printf(
					/* translators: %s: an example request, in quotes */
					esc_html__( 'With our free WPZOOM AI Connect plugin, ask Claude or ChatGPT something like %s and it writes the item, with your photos, for you.', 'wpzoom-portfolio' ),
					'<em>' . esc_html__( '"Add a portfolio item for my latest project"', 'wpzoom-portfolio' ) . '</em>'
				);
				?>
			</p>
			<span class="wpzoom-portfolio-ai-tip__actions">
				<?php if ( $action ) : ?>
					<a class="button button-primary" href="<?php echo esc_url( $action[1] ); ?>"><?php echo esc_html( $action[0] ); ?></a>
				<?php endif; ?>
				<a href="https://www.wpzoom.com/ai-connect/" target="_blank"><?php esc_html_e( 'Learn more', 'wpzoom-portfolio' ); ?></a>
				<a class="wpzoom-portfolio-ai-tip__hide" href="<?php echo esc_url( $hide_url ); ?>"><?php esc_html_e( 'Hide', 'wpzoom-portfolio' ); ?></a>
			</span>
		</div>
		<?php
	}

	/** admin-post.php?action=wpzoom_portfolio_hide_ai_tip: hides the tip for this user and goes back to the portfolio list. */
	public static function hide() {
		check_admin_referer( 'wpzoom_portfolio_hide_ai_tip' );
		if ( current_user_can( 'manage_options' ) ) {
			update_user_meta( get_current_user_id(), self::HIDDEN_META, 1 );
		}
		wp_safe_redirect( admin_url( 'edit.php?post_type=portfolio_item' ) );
		exit;
	}
}

WPZOOM_Portfolio_AI_Tip::init();
