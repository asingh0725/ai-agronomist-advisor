//
//  Fonts.swift
//  CropCopilot
//

import SwiftUI

extension Font {
    // MARK: - Display & Hero
    static let appDisplay     = Font.system(size: 32, weight: .bold)
    static let appTitle       = Font.system(size: 28, weight: .bold)

    // MARK: - Navigation & Section Heads
    static let appHeadline    = Font.system(size: 20, weight: .semibold)
    static let appSubheadline = Font.system(size: 16, weight: .semibold)

    // MARK: - Body
    static let appBody        = Font.system(size: 16, weight: .regular)
    static let appBodySmall   = Font.system(size: 14, weight: .regular)

    // MARK: - Supporting
    static let appCaption     = Font.system(size: 12, weight: .regular)
    static let appCaptionBold = Font.system(size: 12, weight: .semibold)

    // MARK: - Badge / Label
    static let appMicro       = Font.system(size: 10, weight: .semibold)
}
