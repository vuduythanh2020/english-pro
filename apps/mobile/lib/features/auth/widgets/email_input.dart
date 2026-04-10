import 'package:flutter/material.dart';

/// Email input field with realtime validation feedback.
class EmailInput extends StatelessWidget {
  const EmailInput({
    required this.onChanged,
    this.errorText,
    super.key,
  });

  final ValueChanged<String> onChanged;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      onChanged: onChanged,
      keyboardType: TextInputType.emailAddress,
      autocorrect: false,
      textInputAction: TextInputAction.next,
      decoration: InputDecoration(
        labelText: 'Email',
        hintText: 'parent@example.com',
        prefixIcon: const Icon(Icons.email_outlined),
        errorText: errorText,
        border: const OutlineInputBorder(),
      ),
    );
  }
}
