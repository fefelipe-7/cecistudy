/*
 * NativeNavigationPlugin.swift
 * Capacitor plugin for iOS edge swipe-back gesture.
 * Provides native UIScreenEdgePanGestureRecognizer with interactive transition.
 * JS bridge drives logical navigation via handleSystemBack().
 */

import Foundation
import Capacitor
import UIKit

@objc(NativeNavigationPlugin)
public class NativeNavigationPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeNavigationPlugin"
    public let jsName = "NativeNavigation"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "enableSwipeBack", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setCanGoBack", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCanGoBack", returnType: CAPPluginReturnPromise)
    ]
    
    // Gesture recognizer and state
    private var edgePanGesture: UIScreenEdgePanGestureRecognizer?
    private var isEnabled = false
    private var canGoBack = false
    
    // Visual feedback during gesture
    private var originalTransform: CGAffineTransform = .identity
    private var isGestureActive = false
    
    override public func load() {
        super.load()
        setupGestureRecognizer()
    }
    
    private func setupGestureRecognizer() {
        guard let webView = self.bridge?.webView else { return }
        
        edgePanGesture = UIScreenEdgePanGestureRecognizer(target: self, action: #selector(handleEdgePan(_:)))
        edgePanGesture?.edges = .left
        edgePanGesture?.delegate = self
        edgePanGesture?.maximumNumberOfTouches = 1
        webView.addGestureRecognizer(edgePanGesture!)
    }
    
    @objc func handleEdgePan(_ gesture: UIScreenEdgePanGestureRecognizer) {
        guard let webView = self.bridge?.webView,
              isEnabled,
              canGoBack else { return }
        
        let translation = gesture.translation(in: webView)
        let velocity = gesture.velocity(in: webView)
        let progress = min(max(translation.x / webView.bounds.width, 0), 1)
        
        switch gesture.state {
        case .began:
            isGestureActive = true
            originalTransform = webView.transform
            notifyListeners("swipeBackStarted", data: [
                "progress": progress,
                "velocity": velocity.x
            ], retainUntilConsumed: false)
            
        case .changed:
            // Apply visual feedback: translate webView to reveal background
            let clampedTranslation = min(max(translation.x, 0), webView.bounds.width * 0.42)
            let transform = CGAffineTransform(translationX: clampedTranslation, y: 0)
            webView.transform = transform
            
            // Add subtle shadow during gesture
            webView.layer.shadowColor = UIColor.black.cgColor
            webView.layer.shadowOpacity = 0.15
            webView.layer.shadowOffset = CGSize(width: 0, height: 2)
            webView.layer.shadowRadius = 4
            webView.layer.masksToBounds = false
            
            notifyListeners("swipeBackChanged", data: [
                "progress": progress,
                "velocity": velocity.x,
                "translation": clampedTranslation
            ], retainUntilConsumed: false)
            
        case .ended, .cancelled:
            isGestureActive = false
            
            let shouldCommit = (progress >= 0.5) || (velocity.x > 500) // threshold 50% OR high velocity
            
            if shouldCommit {
                // Commit: slide out then let JS handle navigation
                UIView.animate(withDuration: 0.2, delay: 0, options: .curveEaseOut, animations: {
                    webView.transform = CGAffineTransform(translationX: webView.bounds.width, y: 0)
                }) { _ in
                    // Reset transform after slide-out so JS transition plays cleanly
                    webView.transform = self.originalTransform
                    self.notifyListeners("swipeBackCompleted", data: [
                        "progress": progress,
                        "velocity": velocity.x
                    ], retainUntilConsumed: false)
                }
            } else {
                // Cancel: spring back
                UIView.animate(withDuration: 0.2, delay: 0, usingSpringWithDamping: 0.8, initialSpringVelocity: 0, animations: {
                    webView.transform = self.originalTransform
                }) { _ in
                    self.notifyListeners("swipeBackCancelled", data: [
                        "progress": progress,
                        "velocity": velocity.x
                    ], retainUntilConsumed: false)
                }
            }
            
            // Reset shadow
            webView.layer.shadowOpacity = 0
            
        default:
            break
        }
    }
    
    @objc func enableSwipeBack(_ call: CAPPluginCall) {
        isEnabled = true
        call.resolve()
    }
    
    @objc func setCanGoBack(_ call: CAPPluginCall) {
        guard let value = call.getBool("value") else {
            call.reject("Must provide boolean 'value'")
            return
        }
        canGoBack = value
        // Disable gesture if cannot go back
        edgePanGesture?.isEnabled = canGoBack && isEnabled
        call.resolve()
    }
    
    @objc func getCanGoBack(_ call: CAPPluginCall) {
        call.resolve([
            "value": canGoBack
        ])
    }
    
    // UIGestureRecognizerDelegate to prevent conflict with scrolls etc.
    public override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        guard let gesture = gestureRecognizer as? UIScreenEdgePanGestureRecognizer,
              gesture === edgePanGesture else {
            return super.gestureRecognizerShouldBegin(gestureRecognizer)
        }
        // Only allow if there's space to drag (prevent if already at edge)
        return true
    }
}