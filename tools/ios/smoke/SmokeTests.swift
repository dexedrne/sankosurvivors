import XCTest

final class SmokeTests: XCTestCase {
    func testBundledGame() {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "quest.sankosurvivors.casual")
        defer { app.terminate() }
        app.launch()
        let start = app.buttons["Enter the field"]
        waitUntilEnabled(start)
        for name in ["Connect wallet", "Ranked", "Co-op"] {
            XCTAssertFalse(app.buttons[name].exists)
        }
        capture("Native menu")
        start.tap()
        let pause = app.buttons["Pause"]
        XCTAssertTrue(pause.waitForExistence(timeout: 120))
        let field = app.coordinate(withNormalizedOffset: CGVector(dx: 0.22, dy: 0.7))
        field.press(forDuration: 0.2, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.34, dy: 0.6)))
        pause.tap()
        let resume = app.buttons["Resume"]
        XCTAssertTrue(resume.waitForExistence(timeout: 10))
        capture("Paused native run")
        resume.tap()
        pause.tap()
        app.buttons["Quit run"].tap()
        let quit = app.alerts.buttons["Quit run"]
        if quit.exists { quit.tap() } else { app.buttons["Quit run"].tap() }
        XCTAssertTrue(app.buttons["Run it back"].waitForExistence(timeout: 20))
        capture("Finished native run")
        app.buttons["Main menu"].tap()
        waitUntilEnabled(start)
        app.buttons["Best run"].tap()
        let best = app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'level' AND label CONTAINS 'slain'")).firstMatch
        XCTAssertTrue(best.waitForExistence(timeout: 10))
        let savedRecord = best.label
        app.terminate()
        app.launch()
        waitUntilEnabled(start)
        app.buttons["Best run"].tap()
        XCTAssertTrue(app.staticTexts[savedRecord].exists)
        capture("Relaunched native menu")
    }

    // Keep simulator system transitions separate from the core gameplay/save proof.
    func testSystemTransitions() {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "quest.sankosurvivors.casual")
        defer { app.terminate() }
        app.launch()
        let start = app.buttons["Enter the field"]
        waitUntilEnabled(start)
        XCUIDevice.shared.orientation = .landscapeLeft
        let landscape = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in app.frame.width > app.frame.height }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [landscape], timeout: 10), .completed)
        capture("Landscape menu")
        start.tap()
        XCTAssertTrue(app.buttons["Pause"].waitForExistence(timeout: 120))
        XCUIDevice.shared.press(.home)
        XCTAssertTrue([XCUIApplication.State.runningBackground, .runningBackgroundSuspended].contains(app.state))
        app.activate()
        XCTAssertTrue(app.buttons["Resume"].waitForExistence(timeout: 10))
        capture("Paused after interruption")
    }

    private func waitUntilEnabled(_ element: XCUIElement) {
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == true AND enabled == true"), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 120), .completed)
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
