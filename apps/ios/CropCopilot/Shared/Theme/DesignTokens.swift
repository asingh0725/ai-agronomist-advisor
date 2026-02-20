//
//  DesignTokens.swift
//  CropCopilot
//
//  Single source of truth for spacing, corner radii, animation, and shadow constants.
//

import SwiftUI

// MARK: - Spacing

enum Spacing {
    static let xs:   CGFloat =  4
    static let sm:   CGFloat =  8
    static let md:   CGFloat = 12
    static let lg:   CGFloat = 16
    static let xl:   CGFloat = 20
    static let xxl:  CGFloat = 24
    static let xxxl: CGFloat = 32
}

// MARK: - Corner Radius

enum CornerRadius {
    static let sm:  CGFloat =  8
    static let md:  CGFloat = 12
    static let lg:  CGFloat = 16
    static let xl:  CGFloat = 20
    static let xxl: CGFloat = 24
}

// MARK: - Animation Durations

enum AnimationDuration {
    static let fast:   Double = 0.18
    static let medium: Double = 0.30
    static let slow:   Double = 0.60
}

extension Animation {
    static let appFast   = Animation.easeInOut(duration: AnimationDuration.fast)
    static let appMedium = Animation.easeInOut(duration: AnimationDuration.medium)
    static let appSpring = Animation.spring(response: 0.4, dampingFraction: 0.7)
}

// MARK: - Shadow Helpers

extension View {
    /// Lime-tinted glow — used on metric cards and interactive elements.
    func limeShadow(radius: CGFloat = 8, opacity: Double = 0.14) -> some View {
        self.shadow(color: Color.appPrimary.opacity(opacity), radius: radius, x: 0, y: 3)
    }

    /// Earth-green glow — used on hero sections.
    func earthShadow(radius: CGFloat = 16, opacity: Double = 0.18) -> some View {
        self.shadow(color: Color.appSecondary.opacity(opacity), radius: radius, x: 0, y: 6)
    }

    /// Semantic color glow — tints the card shadow to match its content.
    func coloredShadow(_ color: Color, radius: CGFloat = 8, opacity: Double = 0.30) -> some View {
        self.shadow(color: color.opacity(opacity), radius: radius, x: 0, y: 3)
    }
}
