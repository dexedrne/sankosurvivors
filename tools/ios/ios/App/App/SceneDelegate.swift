import UIKit
import Capacitor
import WebKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = GameViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func sceneWillResignActive(_ scene: UIScene) {
        #if DEBUG
        NSLog("SQS scene resign active")
        #endif
        (window?.rootViewController as? GameViewController)?.pauseForInterruption()
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

// The web build remains the game; UIKit owns fullscreen and interruption handling.
final class GameViewController: CAPBridgeViewController {
    override var prefersStatusBarHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .all }

    override func viewDidLoad() {
        super.viewDidLoad()
        overrideUserInterfaceStyle = .dark
        view.backgroundColor = UIColor(red: 30/255, green: 23/255, blue: 16/255, alpha: 1)
        #if DEBUG
        reportReadiness(attempt: 0)
        #endif
    }

    func pauseForInterruption() {
        webView?.evaluateJavaScript("window.dispatchEvent(new Event('blur'))", completionHandler: nil)
    }

    #if DEBUG
    // Bounded diagnostic metadata only; never inspect save contents or account data.
    private func reportReadiness(attempt: Int) {
        guard attempt < 120 else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self] in
            guard let self else { return }
            self.webView?.evaluateJavaScript("JSON.stringify({ready:window.__sqReady===true,secure:window.isSecureContext,locks:!!navigator.locks,viewport:[innerWidth,innerHeight],gate:document.getElementById('profilemessage')?.textContent})") { value, _ in
                let result = value as? String ?? "page not ready"
                if attempt % 10 == 0 || result.contains("\"ready\":true") { NSLog("SQS readiness %@", result) }
                if !result.contains("\"ready\":true") { self.reportReadiness(attempt: attempt + 1) }
            }
        }
    }
    #endif
}
