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
                    let isSelected = selectedTags.contains(tag)
                    Text(tag)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.primary)
                        .padding(.vertical, 12)
                        .padding(.horizontal, 12)
                        .frame(maxWidth: .infinity)
                        .background(
                            Capsule()
                                .fill(
                                    isSelected
                                        ? Color.appPrimary.opacity(0.2)
                                        : Color(uiColor: .tertiarySystemFill)
                                )
                        )
                        .overlay(
                            Capsule()
                                .stroke(
                                    isSelected
                                        ? Color.appPrimary
                                        : Color.black.opacity(0.08),
                                    lineWidth: isSelected ? 1.5 : 0.8
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
