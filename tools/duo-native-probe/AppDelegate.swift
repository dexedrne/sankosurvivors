import UIKit
import WebKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let configuration = UISceneConfiguration(name: "Screen probe", sessionRole: session.role)
        configuration.delegateClass = SceneDelegate.self
        return configuration
    }
}

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let scene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: scene)
        window.rootViewController = ProbeController()
        window.makeKeyAndVisible()
        self.window = window
    }
}

final class ProbeController: UIViewController, WKNavigationDelegate {
    private let web = WKWebView(frame: .zero)
    private var pageReady = false
    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0, green: 0.47, blue: 0.31, alpha: 1)
        web.navigationDelegate = self
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.scrollView.isScrollEnabled = false
        web.isOpaque = false
        web.backgroundColor = view.backgroundColor
        web.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(web)
        NSLayoutConstraint.activate([
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            web.topAnchor.constraint(equalTo: view.topAnchor),
            web.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        if let file = Bundle.main.url(forResource: "screen", withExtension: "html") {
            web.loadFileURL(file, allowingReadAccessTo: file.deletingLastPathComponent())
        } else {
            web.loadHTMLString("<h1>Screen probe file is missing</h1>", baseURL: nil)
        }
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        reportGeometry()
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        pageReady = true
        reportGeometry()
    }
    private func reportGeometry() {
        guard pageReady, let window = view.window else { return }
        let safe = view.safeAreaInsets
        let report: [String: Any] = [
            "nativeView": [view.bounds.width, view.bounds.height],
            "nativeWindow": [window.bounds.width, window.bounds.height],
            "nativeWebView": [web.bounds.width, web.bounds.height],
            "nativeSafeArea": [safe.top, safe.right, safe.bottom, safe.left],
            "nativeStatusBarHidden": window.windowScene?.statusBarManager?.isStatusBarHidden ?? false,
            "builtWithSDK": Bundle.main.object(forInfoDictionaryKey: "DTSDKName") as? String ?? "unknown"
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: report), let json = String(data: data, encoding: .utf8) else { return }
        web.evaluateJavaScript("window.reportNativeGeometry(\(json))", completionHandler: nil)
    }
}
