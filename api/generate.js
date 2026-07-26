import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // CORS 처리 및 POST 메서드 검증
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gender, height, weight } = req.body;

  if (!gender || !height || !weight) {
    return res.status(400).json({ error: '성별, 키, 몸무게를 모두 입력해 주세요.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // 계산 로직 (BMI 및 적정체중 계산)
    const heightInMeters = parseFloat(height) / 100;
    const weightInKg = parseFloat(weight);
    const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);

    const prompt = `
사용자 정보:
- 성별: ${gender}
- 키: ${height}cm
- 몸무게: ${weight}kg
- 계산된 BMI 지수: ${bmi}

위 정보를 바탕으로 보건복지부/KDA 기준에 맞추어 다음 내용을 분석하고 작성해 주세요.
응답 형식은 깔끔한 Markdown 형식(제목, 불릿포인트 사용)으로 작성해 주세요.

1. **BMI 분석 및 적정체중 평가**:
   - 현재 BMI 지수(${bmi})의 성인 기준 범위(저체중/정상/비만전단계/비만 등) 안내
   - 키(${height}cm) 기준 표준 적정체중 범위 제안
   - 현재 체중에 대한 간단한 종합 조언

2. **맞춤형 하루 추천 식단 (아침, 점심, 저녁, 간식)**:
   - 영양 균형을 고려한 구체적인 메뉴 추천
   - 식단 조절 시 주의할 점 2~3가지
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.status(200).json({
      bmi,
      analysis: response.text,
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: '체중 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
}
