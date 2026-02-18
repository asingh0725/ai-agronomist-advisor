//
//  TagGridSelector.swift
//  CropCopilot
//

import SwiftUI

struct TagGridSelector: View {
    let tags: [String]
    @Binding var selectedTags: Set<String>

    @State private var hapticPulse = 0

    private let columns = [
        GridItem(.adaptive(minimum: 100), spacing: 12)
    ]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(tags, id: \.self) { tag in
                Button {
                    toggle(tag)
                } label: {
                    Text(tag)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.white)
                        .padding(.vertical, 12)
                        .padding(.horizontal, 12)
                        .frame(maxWidth: .infinity)
                        .background(
                            Capsule()
                                .fill(
                                    selectedTags.contains(tag)
                                        ? Color.appPrimary.opacity(0.2)
                                        : Color.white.opacity(0.05)
                                )
                        )
                        .overlay(
                            Capsule()
                                .stroke(
                                    selectedTags.contains(tag)
                                        ? Color.appPrimary
                                        : Color.white.opacity(0.14),
                                    lineWidth: selectedTags.contains(tag) ? 1.5 : 0.7
                                )
                        )
                }
                .buttonStyle(AntigravityScaleButtonStyle())
            }
        }
        .sensoryFeedback(.selection, trigger: hapticPulse)
    }

    private func toggle(_ tag: String) {
        if selectedTags.contains(tag) {
            selectedTags.remove(tag)
        } else {
            selectedTags.insert(tag)
        }
        hapticPulse += 1
    }
}
