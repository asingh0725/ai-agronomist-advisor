//
//  CanvasConfidenceArc.swift
//  CropCopilot
//
//  Created for Antigravity Revitalization
//

import SwiftUI

struct CanvasConfidenceArc: View {
    let confidence: Double // 0.0 to 1.0
    
    var body: some View {
        Canvas { context, size in
            // Center & Radius
            let center = CGPoint(x: size.width / 2, y: size.height)
            let radius = min(size.width, size.height) - 4
            
            // 1. Background Arc (dim)
            let bgPath = Path { p in
                p.addArc(center: center, radius: radius, startAngle: .degrees(180), endAngle: .degrees(0), clockwise: false)
            }
            context.stroke(bgPath, with: .color(.white.opacity(0.1)), lineWidth: 6)
            
            // 2. Glowing Active Arc
            let activePath = Path { p in
                p.addArc(center: center, radius: radius, startAngle: .degrees(180), endAngle: .degrees(180 + (180 * confidence)), clockwise: false)
            }
            
            // Glow
            var glowContext = context
            glowContext.addFilter(.blur(radius: 5))
            glowContext.stroke(activePath, with: .color(Color.appPrimary), lineWidth: 8)
            
            // Core Line
            context.stroke(activePath, with: .color(Color.appPrimary), lineWidth: 6)
            
        }
        .aspectRatio(2, contentMode: .fit)
        .overlay(alignment: .bottom) {
            Text("\(Int(confidence * 100))%")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundColor(Color.appPrimary)
                .offset(y: -5)
        }
    }
}
