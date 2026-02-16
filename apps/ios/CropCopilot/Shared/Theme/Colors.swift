//
//  Colors.swift
//  CropCopilot
//
//  Created by Claude Code on Phase 1
//

import SwiftUI

extension Color {
    /// Lime green — matches web primary CTA (#76C043)
    static let appPrimary = Color(red: 0x76/255, green: 0xC0/255, blue: 0x43/255)
    /// Earth green — matches web earth-700 (#2C5F2D)
    static let appSecondary = Color(red: 0x2C/255, green: 0x5F/255, blue: 0x2D/255)
    /// Amber warm — matches web accent (#F5A623)
    static let appAccent = Color(red: 0xF5/255, green: 0xA6/255, blue: 0x23/255)
    static let appBackground = Color(uiColor: .systemBackground)
    static let appSecondaryBackground = Color(uiColor: .secondarySystemBackground)
}
