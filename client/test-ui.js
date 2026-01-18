/**
 * UI Test Script for Kaam247
 * 
 * This script checks for common UI issues:
 * - Horizontal scroll
 * - Overflow issues
 * - Padding inconsistencies
 * - Touch target sizes
 * - Text wrapping
 * - Responsive breakpoints
 */

console.log('🧪 Starting UI Tests...\n')

const issues = []
const warnings = []

// Test 1: Check for horizontal scroll
function testHorizontalScroll() {
  console.log('📏 Testing for horizontal scroll...')
  
  const body = document.body
  const html = document.documentElement
  
  const bodyScrollWidth = body.scrollWidth
  const bodyClientWidth = body.clientWidth
  const htmlScrollWidth = html.scrollWidth
  const htmlClientWidth = html.clientWidth
  
  if (bodyScrollWidth > bodyClientWidth) {
    issues.push({
      type: 'horizontal-scroll',
      severity: 'error',
      message: `Body has horizontal scroll: scrollWidth (${bodyScrollWidth}) > clientWidth (${bodyClientWidth})`,
      element: 'body'
    })
  }
  
  if (htmlScrollWidth > htmlClientWidth) {
    issues.push({
      type: 'horizontal-scroll',
      severity: 'error',
      message: `HTML has horizontal scroll: scrollWidth (${htmlScrollWidth}) > clientWidth (${htmlClientWidth})`,
      element: 'html'
    })
  }
  
  // Check all containers
  const containers = document.querySelectorAll('[class*="max-w"], [class*="w-full"], [class*="overflow"]')
  containers.forEach((container, index) => {
    if (container.scrollWidth > container.clientWidth && container.scrollWidth > window.innerWidth) {
      warnings.push({
        type: 'container-overflow',
        severity: 'warning',
        message: `Container may overflow: ${container.className.substring(0, 50)}...`,
        element: container
      })
    }
  })
  
  console.log(issues.length === 0 && warnings.length === 0 ? '✅ No horizontal scroll detected' : '⚠️ Issues found')
}

// Test 2: Check padding on mobile screens
function testMobilePadding() {
  console.log('\n📱 Testing mobile padding...')
  
  // Simulate mobile viewport
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight
  
  // Set to mobile size (360px)
  window.innerWidth = 360
  window.innerHeight = 800
  
  const mainContent = document.querySelector('main')
  const pages = document.querySelectorAll('[class*="max-w"]')
  
  pages.forEach((page) => {
    const styles = window.getComputedStyle(page)
    const paddingLeft = parseInt(styles.paddingLeft) || 0
    const paddingRight = parseInt(styles.paddingRight) || 0
    const marginLeft = parseInt(styles.marginLeft) || 0
    const marginRight = parseInt(styles.marginRight) || 0
    
    // Check if padding is too large on mobile (should be <= 12px ideally)
    if (paddingLeft > 16 || paddingRight > 16) {
      warnings.push({
        type: 'mobile-padding',
        severity: 'warning',
        message: `Large padding detected on mobile: left=${paddingLeft}px, right=${paddingRight}px`,
        element: page
      })
    }
  })
  
  // Restore original viewport
  window.innerWidth = originalWidth
  window.innerHeight = originalHeight
  
  console.log(warnings.length === 0 ? '✅ Mobile padding looks good' : '⚠️ Some padding issues found')
}

// Test 3: Check touch target sizes
function testTouchTargets() {
  console.log('\n👆 Testing touch target sizes...')
  
  const interactiveElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"]')
  let smallTargets = 0
  
  interactiveElements.forEach((element) => {
    const rect = element.getBoundingClientRect()
    const minSize = 44 // Minimum touch target size in pixels
    
    if (rect.width < minSize || rect.height < minSize) {
      smallTargets++
      warnings.push({
        type: 'touch-target',
        severity: 'warning',
        message: `Small touch target: ${rect.width}x${rect.height}px (minimum: ${minSize}x${minSize}px)`,
        element: element
      })
    }
  })
  
  console.log(smallTargets === 0 ? '✅ All touch targets meet minimum size' : `⚠️ Found ${smallTargets} small touch targets`)
}

// Test 4: Check text wrapping
function testTextWrapping() {
  console.log('\n📝 Testing text wrapping...')
  
  const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, div')
  let overflowIssues = 0
  
  textElements.forEach((element) => {
    const styles = window.getComputedStyle(element)
    const overflow = styles.overflow
    const overflowWrap = styles.overflowWrap
    const wordWrap = styles.wordWrap
    
    // Check if text can overflow without wrapping
    if (overflow === 'visible' && !overflowWrap && !wordWrap) {
      const text = element.textContent || ''
      if (text.length > 50) { // Only check long text
        const rect = element.getBoundingClientRect()
        const scrollWidth = element.scrollWidth
        const clientWidth = element.clientWidth
        
        if (scrollWidth > clientWidth + 5) { // 5px tolerance
          overflowIssues++
          warnings.push({
            type: 'text-overflow',
            severity: 'warning',
            message: `Text may overflow: ${text.substring(0, 30)}...`,
            element: element
          })
        }
      }
    }
  })
  
  console.log(overflowIssues === 0 ? '✅ Text wrapping looks good' : `⚠️ Found ${overflowIssues} potential text overflow issues`)
}

// Test 5: Check for overflow-x-hidden
function testOverflowHidden() {
  console.log('\n🔒 Testing overflow protection...')
  
  const mainContainers = document.querySelectorAll('main, [class*="container"], [class*="max-w"]')
  let missingOverflow = 0
  
  mainContainers.forEach((container) => {
    const styles = window.getComputedStyle(container)
    const overflowX = styles.overflowX
    const className = container.className || ''
    
    // Check if overflow-x-hidden is applied
    if (!className.includes('overflow-x-hidden') && overflowX !== 'hidden') {
      missingOverflow++
      warnings.push({
        type: 'missing-overflow',
        severity: 'info',
        message: 'Container missing overflow-x-hidden class',
        element: container
      })
    }
  })
  
  console.log(missingOverflow === 0 ? '✅ Overflow protection applied' : `ℹ️ Found ${missingOverflow} containers without overflow protection`)
}

// Test 6: Check responsive breakpoints
function testResponsiveBreakpoints() {
  console.log('\n📐 Testing responsive breakpoints...')
  
  const breakpoints = [360, 390, 768, 1024]
  const results = {}
  
  breakpoints.forEach((width) => {
    // Simulate viewport
    const originalWidth = window.innerWidth
    window.innerWidth = width
    
    // Force reflow
    document.body.offsetHeight
    
    const bodyScrollWidth = document.body.scrollWidth
    const hasHorizontalScroll = bodyScrollWidth > width
    
    results[width] = {
      scrollWidth: bodyScrollWidth,
      hasScroll: hasHorizontalScroll
    }
    
    if (hasHorizontalScroll) {
      issues.push({
        type: 'responsive-scroll',
        severity: 'error',
        message: `Horizontal scroll detected at ${width}px width`,
        viewport: width
      })
    }
    
    window.innerWidth = originalWidth
  })
  
  console.log('✅ Responsive breakpoints tested')
  console.log('Results:', results)
}

// Test 7: Check for common CSS issues
function testCommonCSSIssues() {
  console.log('\n🎨 Testing common CSS issues...')
  
  // Check for min-width: 0 on flex items
  const flexContainers = document.querySelectorAll('[class*="flex"]')
  let flexIssues = 0
  
  flexContainers.forEach((container) => {
    const children = container.children
    Array.from(children).forEach((child) => {
      const styles = window.getComputedStyle(child)
      const minWidth = styles.minWidth
      const className = child.className || ''
      
      if (minWidth !== '0px' && !className.includes('min-w-0') && !className.includes('flex-shrink-0')) {
        flexIssues++
      }
    })
  })
  
  // Check for break-words
  const textContainers = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6')
  let missingBreakWords = 0
  
  textContainers.forEach((container) => {
    const className = container.className || ''
    const styles = window.getComputedStyle(container)
    const overflowWrap = styles.overflowWrap
    
    if (!className.includes('break-words') && overflowWrap !== 'break-word' && overflowWrap !== 'anywhere') {
      const text = container.textContent || ''
      if (text.length > 20) {
        missingBreakWords++
      }
    }
  })
  
  console.log(`ℹ️ Found ${flexIssues} potential flex item issues`)
  console.log(`ℹ️ Found ${missingBreakWords} text elements that could benefit from break-words`)
}

// Run all tests
function runAllTests() {
  testHorizontalScroll()
  testMobilePadding()
  testTouchTargets()
  testTextWrapping()
  testOverflowHidden()
  testResponsiveBreakpoints()
  testCommonCSSIssues()
  
  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`❌ Errors: ${issues.filter(i => i.severity === 'error').length}`)
  console.log(`⚠️  Warnings: ${warnings.filter(w => w.severity === 'warning').length}`)
  console.log(`ℹ️  Info: ${warnings.filter(w => w.severity === 'info').length}`)
  
  if (issues.length > 0) {
    console.log('\n❌ ERRORS:')
    issues.filter(i => i.severity === 'error').forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.message}`)
    })
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    warnings.filter(w => w.severity === 'warning').forEach((warning, index) => {
      console.log(`${index + 1}. ${warning.message}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  
  if (issues.length === 0 && warnings.filter(w => w.severity === 'warning').length === 0) {
    console.log('✅ All critical UI tests passed!')
    return true
  } else {
    console.log('⚠️  Some UI issues detected. Please review above.')
    return false
  }
}

// Export for use in browser console or automated testing
if (typeof window !== 'undefined') {
  window.runUITests = runAllTests
  console.log('\n💡 Run window.runUITests() to execute all tests')
}

// Auto-run if in browser
if (typeof window !== 'undefined' && document.readyState === 'complete') {
  setTimeout(() => {
    runAllTests()
  }, 1000)
} else if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      runAllTests()
    }, 1000)
  })
}

export { runAllTests, testHorizontalScroll, testMobilePadding, testTouchTargets, testTextWrapping }

